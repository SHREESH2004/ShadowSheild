import { ipEngine } from "../engines/ip/ipEngine.js";
import { redisClient } from "../redis_client/redis_client.js";
import { updateIPState } from "../engines/ip/ipState.js";
export async function shadowsheild(req, res, next) {
    const ip = req.ip;
    if (!ip) {
        return res.status(400).json({ message: "IP not found" });
    }
    const blocked = await redisClient.get(`block:ip:${ip}`);
    if (blocked) {
        return res.status(403).json({ message: "Blocked" });
    }
    const start = Date.now();
    res.on("finish", async () => {
        const latency = Date.now() - start;
        await updateIPState({
            ip,
            endpoint: req.originalUrl,
            status: res.statusCode,
            latency,
            bytes: Number(res.getHeader("content-length") || 0)
        });
        const risk = await ipEngine(ip);
        if (risk > 0.85) {
            await redisClient.set(`block:ip:${ip}`, "1", {
                EX: 600
            });
        }
        console.log(risk);
    });
    next();
}
//# sourceMappingURL=shadowsheild.js.map