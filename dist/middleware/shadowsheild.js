import { IPRiskScore, writeIPData } from "../engines/ip/ip.Engine.js";
import { SessionRiskScore, writeSessionData } from "../engines/session/session.engine.js";
import { client } from "../config/redis.js";
export const shadowShield = (options = {}) => {
    const THRESHOLD = options.threshold || 0.7;
    const BLOCK_TTL = options.blockTTL || 3600;
    return async (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
            || (req.ip === '::1' ? '127.0.0.1' : req.ip)
            || '0.0.0.0';
        const sessionId = (req.session?.id
            || req.headers['x-session-id']
            || ip);
        const blocked = await client.get(`block:${ip}`);
        if (blocked) {
            res.status(429).json({ error: "Too many requests", blocked: true });
            return;
        }
        const lastIP = await client.get(`session:${sessionId}:ip`);
        if (lastIP && lastIP !== ip) {
            await Promise.all([
                client.set(`block:${ip}`, '1', 'EX', BLOCK_TTL),
                client.set(`block:${lastIP}`, '1', 'EX', BLOCK_TTL),
            ]);
            console.log(`IMPOSSIBLE TRAVEL: ${sessionId} | ${lastIP} → ${ip}`);
            res.status(429).json({ error: "Suspicious activity detected", blocked: true });
            return;
        }
        next();
        res.on('finish', async () => {
            const activityData = {
                ip,
                endpoint: req.path,
                statusCode: res.statusCode,
                responseSize: +(res.getHeader('content-length') || 0),
            };
            const sessionData = {
                sessionId,
                endpoint: req.path,
                statusCode: res.statusCode,
                ip,
            };
            await Promise.all([
                writeIPData(activityData),
                writeSessionData(sessionData),
            ]);
            const [ipRisk, sessionRisk] = await Promise.all([
                IPRiskScore(ip),
                SessionRiskScore(sessionId),
            ]);
            const finalRisk = (0.5 * ipRisk) + (0.5 * sessionRisk);
            if (finalRisk >= THRESHOLD || sessionRisk >= 0.8) {
                await client.set(`block:${ip}`, '1', 'EX', BLOCK_TTL);
                console.log(`BLOCKED: ${ip} | ip: ${ipRisk.toFixed(2)} | session: ${sessionRisk.toFixed(2)} | final: ${finalRisk.toFixed(2)}`);
            }
            console.log(`IP: ${ip} | session: ${sessionId} | ip_risk: ${ipRisk.toFixed(2)} | session_risk: ${sessionRisk.toFixed(2)} | final: ${finalRisk.toFixed(2)}`);
        });
    };
};
//# sourceMappingURL=shadowsheild.js.map