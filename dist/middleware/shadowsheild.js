import { writeIPData } from "../engines/ip/ipEngine.js";
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
    const cachedRisk = await client.get(`risk:ip:${ip}`);
    if (cachedRisk && parseFloat(cachedRisk) > 0.8) {
        res.status(429).json({
            error: "Suspicious activity detected",
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
    });
};
//# sourceMappingURL=shadowsheild.js.map