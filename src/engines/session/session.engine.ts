import { client } from "../../config/redis.js"

const SESSION_WINDOW = 60
const MAX_RPM = 150
const MAX_CV = 2

export interface SessionStructure {
    sessionId: string
    endpoint: string
    statusCode: number
    ip: string
}

export const writeSessionData = async (data: SessionStructure): Promise<void> => {

    const timestamp = Date.now().toString()

    await Promise.all([
        client.lpush(`session:${data.sessionId}:timestamps`, timestamp),
        client.expire(`session:${data.sessionId}:timestamps`, SESSION_WINDOW),

        client.hincrby(`session:${data.sessionId}:endpoints`, data.endpoint, 1),
        client.expire(`session:${data.sessionId}:endpoints`, SESSION_WINDOW),

        client.set(`session:${data.sessionId}:ip`, data.ip, 'EX', SESSION_WINDOW),
    ])
}

export const SessionFeature = async (sessionId: string) => {

    const [timestamps, endpoints] = await Promise.all([
        client.lrange(`session:${sessionId}:timestamps`, 0, -1),
        client.hgetall(`session:${sessionId}:endpoints`),
    ])

    const now = Date.now()
    const recentTs = timestamps
        .map(Number)
        .filter(t => now - t <= SESSION_WINDOW * 1000)
    const rpm = recentTs.length

    const endpointMap = endpoints || {}
    const endpointVals = Object.values(endpointMap).map(Number)
    const endpointSum = endpointVals.reduce((a, b) => a + b, 0)
    let entropy = 0

    if (endpointSum > 0) {
        endpointVals.forEach(count => {
            const p = count / endpointSum
            if (p > 0) entropy -= p * Math.log2(p)
        })
    }

    let cvGap = 1.0

    if (recentTs.length > 2) {
        const sorted = [...recentTs].sort((a, b) => a - b)
        const gaps = sorted.slice(1).map((t, i) => t - sorted[i])
        const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
        const std = Math.sqrt(
            gaps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / gaps.length
        )
        cvGap = mean > 0 ? std / mean : 0
    }

    return {
        rpm,
        entropy,
        cvGap,
        vector: [rpm, entropy, cvGap]
    }
}

export const SessionRiskScore = async (sessionId: string): Promise<number> => {

    const { rpm, entropy, cvGap } = await SessionFeature(sessionId)

    const normRpm = Math.min(rpm / MAX_RPM, 1)
    const maxEntropy = Math.log2(10)
    const normEntropy = Math.min(entropy / maxEntropy, 1)
    const entropyScore = Math.abs(normEntropy - 0.5) * 2
    const normCvGap = Math.min(cvGap / MAX_CV, 1)
    const cvGapScore = 1 - normCvGap

    const risk = (
        (0.35 * normRpm) +
        (0.35 * cvGapScore) +
        (0.30 * entropyScore)
    )

    return Math.min(risk, 1.0)
}

export const getSessionScore = async (sessionId: string): Promise<number> => {

    const cached = await client.get(`risk:session:${sessionId}`)
    if (cached) return parseFloat(cached)

    return await SessionRiskScore(sessionId)
}
