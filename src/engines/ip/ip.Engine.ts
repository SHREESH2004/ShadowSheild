import { Redis } from "ioredis"

const IP_WINDOW = 60
const MAX_RPM   = 150
const MAX_CV    = 2

export interface ipstructure {
    ip:           string
    endpoint:     string
    statusCode:   number
    responseSize: number
}

export const writeIPData = async (data: ipstructure, redis: Redis): Promise<void> => {

    const timestamp = Date.now().toString()
    const isError   = data.statusCode >= 400

    await Promise.all([
        redis.lpush(`ip:${data.ip}:timestamps`, timestamp),
        redis.expire(`ip:${data.ip}:timestamps`, IP_WINDOW),

        redis.hincrby(`ip:${data.ip}:endpoints`, data.endpoint, 1),
        redis.expire(`ip:${data.ip}:endpoints`, IP_WINDOW),

        redis.incr(`ip:${data.ip}:total`),
        redis.expire(`ip:${data.ip}:total`, IP_WINDOW),

        redis.incrby(`ip:${data.ip}:bytes`, data.responseSize),
        redis.expire(`ip:${data.ip}:bytes`, IP_WINDOW),

        ...(isError ? [
            redis.incr(`ip:${data.ip}:errors`),
            redis.expire(`ip:${data.ip}:errors`, IP_WINDOW),
        ] : [])
    ])
}

export const IPFeatures = async (ip: string, redis: Redis) => {

    const [timestamps, endpoints, total, errors, bytes] = await Promise.all([
        redis.lrange(`ip:${ip}:timestamps`, 0, -1),
        redis.hgetall(`ip:${ip}:endpoints`),
        redis.get(`ip:${ip}:total`),
        redis.get(`ip:${ip}:errors`),
        redis.get(`ip:${ip}:bytes`)
    ])

    const now      = Date.now()
    const recentTs = timestamps
        .map(Number)
        .filter(t => now - t <= IP_WINDOW * 1000)
    const rpm = recentTs.length

    const totalReqs = parseInt(total  || '0')
    const errorReqs = parseInt(errors || '0')
    const errorRate = totalReqs > 0 ? errorReqs / totalReqs : 0

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

export const IPRiskScore = async (ip: string, redis: Redis): Promise<number> => {

    const { rpm, errorRate, entropy, cvGap, volumeMb } = await IPFeatures(ip, redis)

    const normRpm      = Math.min(rpm / MAX_RPM, 1)
    const maxEntropy   = Math.log2(10)
    const normEntropy  = Math.min(entropy / maxEntropy, 1)
    const entropyScore = Math.abs(normEntropy - 0.5) * 2
    const normCvGap    = Math.min(cvGap / MAX_CV, 1)
    const cvGapScore   = 1 - normCvGap
    const normVolume   = Math.min(volumeMb / 50, 1)

    const risk = (
        (0.30 * normRpm)      +
        (0.10 * errorRate)    +
        (0.25 * entropyScore) +
        (0.25 * cvGapScore)   +
        (0.10 * normVolume)
    )

    return Math.min(risk, 1.0)
}
