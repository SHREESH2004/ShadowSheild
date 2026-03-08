import { IPRiskScore, writeIPData } from "../engines/ip/ip.Engine.js";
import { client } from "../config/redis.js";
import { SessionRiskScore, writeSessionData } from "../engines/session/session.engine.js";
export const shadowShield = async (req, res, next) => {
    const ip = req.ip === '::1' ? '127.0.0.1' : (req.ip || '0.0.0.0');
    const sessionId = (req.cookies?.session_id
        || req.headers['x-session-id']
        || ip);
    const blocked = await client.get(`block:${ip}`);
    if (blocked) {
        res.status(429).json({
            error: "Too many requests",
            blocked: true
        });
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
        await writeIPData(activityData);
        const ipRisk = await IPRiskScore(ip);
        const sessionData = {
            sessionId,
            endpoint: req.path,
            statusCode: res.statusCode,
        };
        await writeSessionData(sessionData);
        const sessionRisk = await SessionRiskScore(sessionId);
        const finalRisk = (0.625 * ipRisk) + (0.475 * sessionRisk);
        if (finalRisk >= 0.7 || sessionRisk >= 0.8) {
            await client.set(`block:${ip}`, '1', 'EX', 3600);
            console.log(`BLOCKED: ${ip} | ip: ${ipRisk.toFixed(2)} | session: ${sessionRisk.toFixed(2)} | final: ${finalRisk.toFixed(2)}`);
        }
        console.log(`IP: ${ip} | endpoint: ${req.path} | risk: ${finalRisk.toFixed(2)}`);
    });
};
//# sourceMappingURL=shadowsheild.js.map