import { Redis } from "ioredis"
import { Request, Response, NextFunction } from "express"
import { IPRiskScore, writeIPData, ipstructure } from "../engines/ip/ip.Engine.js"
import { SessionRiskScore, SessionStructure, writeSessionData } from "../engines/session/session.engine.js"

export interface ShadowShieldOptions {
    redisUrl?: string
    redisHost?: string
    redisPort?: number
    redisPassword?: string
    threshold?: number
    blockTTL?: number
}

export const shadowShield = (options: ShadowShieldOptions = {}) => {

    const redis = options.redisUrl
        ? new Redis(options.redisUrl)
        : new Redis({
            host: options.redisHost || "127.0.0.1",
            port: options.redisPort || 6379,
            password: options.redisPassword || undefined,
        })

    const THRESHOLD = options.threshold || 0.7
    const BLOCK_TTL = options.blockTTL || 3600

    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {

        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
            || (req.ip === '::1' ? '127.0.0.1' : req.ip)
            || '0.0.0.0'

        const sessionId = (req.session?.id
            || req.headers['x-session-id']
            || ip) as string

        const blocked = await redis.get(`block:${ip}`)
        if (blocked) {
            res.status(429).json({ error: "Too many requests", blocked: true })
            return
        }

        const lastIP = await redis.get(`session:${sessionId}:ip`)
        if (lastIP && lastIP !== ip) {
            await Promise.all([
                redis.set(`block:${ip}`, '1', 'EX', BLOCK_TTL),
                redis.set(`block:${lastIP}`, '1', 'EX', BLOCK_TTL),
            ])
            console.log(`IMPOSSIBLE TRAVEL: ${sessionId} | ${lastIP} → ${ip}`)
            res.status(429).json({ error: "Suspicious activity detected", blocked: true })
            return
        }

        next()

        res.on('finish', async () => {

            const activityData: ipstructure = {
                ip,
                endpoint: req.path,
                statusCode: res.statusCode,
                responseSize: +(res.getHeader('content-length') || 0),
            }

            const sessionData: SessionStructure = {
                sessionId,
                endpoint: req.path,
                statusCode: res.statusCode,
                ip,
            }

            await Promise.all([
                writeIPData(activityData, redis),
                writeSessionData(sessionData, redis),
            ])

            const [ipRisk, sessionRisk] = await Promise.all([
                IPRiskScore(ip, redis),
                SessionRiskScore(sessionId, redis),
            ])

            const finalRisk = (0.5 * ipRisk) + (0.5 * sessionRisk)

            if (finalRisk >= THRESHOLD || sessionRisk >= 0.8) {
                await redis.set(`block:${ip}`, '1', 'EX', BLOCK_TTL)
                console.log(`BLOCKED: ${ip} | ip: ${ipRisk.toFixed(2)} | session: ${sessionRisk.toFixed(2)} | final: ${finalRisk.toFixed(2)}`)
            }

            console.log(`IP: ${ip} | ip_risk: ${ipRisk.toFixed(2)} | session_risk: ${sessionRisk.toFixed(2)} | final: ${finalRisk.toFixed(2)}`)
        })
    }
}
