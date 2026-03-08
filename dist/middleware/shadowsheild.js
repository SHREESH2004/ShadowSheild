import { IPRiskScore, writeIPData } from "../engines/ip/ipEngine.js";
import { client } from "../config/redis.js";
export const shadowShield = async (req, res, next) => {
    const ip = req.ip === '::1' ? '127.0.0.1' : (req.ip || '0.0.0.0');
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
        const risk = await IPRiskScore(ip);
        if (Number(risk) >= 0.7) {
            await client.set(`block:${ip}`, '1', 'EX', 3600);
            console.log(`🚨 IP BLOCKED: ${ip} | risk: ${risk.toFixed(2)}`);
        }
        console.log(`📊 IP: ${ip} | endpoint: ${req.path} | risk: ${risk.toFixed(2)}`);
    });
};
//# sourceMappingURL=shadowsheild.js.map