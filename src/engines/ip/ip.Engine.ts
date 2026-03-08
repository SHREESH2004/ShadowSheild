import { client } from "../../config/redis.js";

const IP_WINDOW = 60
const MAX_RPM   = 150
const MAX_CV    = 2
const MAX_BYTES = 52428800

export interface ipstructure {
    ip: string,
    endpoint: string,
    statusCode: number,
    responseSize: number,
}

export const writeIPData = async (data: ipstructure): Promise<void> => {
    const timestamp = Date.now().toString()
    const isError   = data.statusCode >= 400

    await Promise.all([
        client.lpush(`ip:${data.ip}:timestamps`, timestamp),
        client.expire(`ip:${data.ip}:timestamps`, IP_WINDOW),

        client.hincrby(`ip:${data.ip}:endpoints`, data.endpoint, 1),
        client.expire(`ip:${data.ip}:endpoints`, IP_WINDOW),

        client.incr(`ip:${data.ip}:total`),
        client.expire(`ip:${data.ip}:total`, IP_WINDOW),

        client.incrby(`ip:${data.ip}:bytes`, data.responseSize),
        client.expire(`ip:${data.ip}:bytes`, IP_WINDOW),

        ...(isError ? [
            client.incr(`ip:${data.ip}:errors`),
            client.expire(`ip:${data.ip}:errors`, IP_WINDOW),
        ] : [])
    ])
}

export const IPFeatures = async (ip: string) => {

    const [timestamps, endpoints, total, errors, bytes] = await Promise.all([
        client.lrange(`ip:${ip}:timestamps`, 0, -1),
        client.hgetall(`ip:${ip}:endpoints`),
        client.get(`ip:${ip}:total`),
        client.get(`ip:${ip}:errors`),
        client.get(`ip:${ip}:bytes`)
    ])
    // ── rpm ──
    const now      = Date.now()
    const recentTs = timestamps
        .map(Number)
        .filter(t => now - t <= IP_WINDOW * 1000)
    const rpm = recentTs.length

    // ── error rate ──
    const totalReqs = parseInt(total  || '0')
    const errorReqs = parseInt(errors || '0')
    const errorRate = totalReqs > 0 ? errorReqs / totalReqs : 0

    // ── endpoint entropy ──
    const endpointMap  = endpoints || {}
    const endpointVals = Object.values(endpointMap).map(Number)
    const endpointSum  = endpointVals.reduce((a, b) => a + b, 0)
    let   entropy      = 0

    if (endpointSum > 0) {
        endpointVals.forEach(count => {
            const p = count / endpointSum
            if (p > 0) entropy -= p * Math.log2(p)
        })
    }

    // ── cv_gap ──
    let cvGap = 1.0

    if (recentTs.length > 2) {
        const sorted = [...recentTs].sort((a, b) => a - b)
        const gaps   = sorted.slice(1).map((t, i) => t - sorted[i])
        const mean   = gaps.reduce((a, b) => a + b, 0) / gaps.length
        const std    = Math.sqrt(
            gaps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / gaps.length
        )
        cvGap = mean > 0 ? std / mean : 0
    }

    // ── volume ──
    const volumeMb = parseInt(bytes || '0') / (1024 * 1024)

    return {
        rpm,
        errorRate,
        entropy,
        cvGap,
        volumeMb,
        vector: [rpm, errorRate, entropy, cvGap, volumeMb]
    }
}

export const IPRiskScore = async (ip: string): Promise<number> => {

    const features = await IPFeatures(ip)
    const { rpm, errorRate, entropy, cvGap, volumeMb } = features

    // ── normalize rpm ──
    const normRpm = Math.min(rpm / MAX_RPM, 1)

    // ── entropy score ──
    const maxEntropy   = Math.log2(10)
    const normEntropy  = Math.min(entropy / maxEntropy, 1)
    const entropyScore = Math.abs(normEntropy - 0.5) * 2

    const normCvGap  = Math.min(cvGap / MAX_CV, 1)
    const cvGapScore = 1 - normCvGap
    const normVolume = Math.min(volumeMb / 50, 1)
    const risk = (
        (0.30 * normRpm)      +   // request frequency
        (0.10 * errorRate)    +   
        (0.25 * entropyScore) +   // endpoint diversity
        (0.25 * cvGapScore)   +   // timing gaps
        (0.10 * normVolume)       // data volume
    )

    return Math.min(risk, 1.0)
}

export const getIPScore = async (ip: string): Promise<number> => {

    const cached = await client.get(`risk:ip:${ip}`)
    if (cached) return parseFloat(cached)

    return await IPRiskScore(ip)
}