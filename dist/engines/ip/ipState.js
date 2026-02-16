import { redisClient } from "../../redis_client/redis_client.js";
const WINDOW_MS = 60 * 1000;
export async function updateIPState(data) {
    const now = Date.now();
    const { ip, endpoint, status, latency, bytes, payloadHash } = data;
    await redisClient.zAdd(`ip:timeline:${ip}`, {
        score: now,
        value: `${now}`
    });
    await redisClient.zRemRangeByScore(`ip:timeline:${ip}`, 0, now - WINDOW_MS);
    await redisClient.hIncrBy(`ip:stats:${ip}`, "totalRequests", 1);
    await redisClient.hIncrBy(`ip:stats:${ip}`, "totalBytes", bytes);
    await redisClient.hIncrBy(`ip:stats:${ip}`, "totalLatency", latency);
    if (status >= 400) {
        await redisClient.hIncrBy(`ip:stats:${ip}`, "errorCount", 1);
    }
    await redisClient.hIncrBy(`ip:endpoints:${ip}`, endpoint, 1);
    if (payloadHash) {
        await redisClient.hIncrBy(`ip:payload:${ip}`, payloadHash, 1);
    }
    await redisClient.expire(`ip:stats:${ip}`, 3600);
    await redisClient.expire(`ip:endpoints:${ip}`, 3600);
    await redisClient.expire(`ip:payload:${ip}`, 3600);
}
//# sourceMappingURL=ipState.js.map