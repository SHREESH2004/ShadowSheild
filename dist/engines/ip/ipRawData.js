import { redisClient } from "../../redis_client/redis_client.js";
export async function getIPRawData(ip) {
    const pipeline = redisClient.multi();
    pipeline.zCard(`ip:timeline:${ip}`);
    pipeline.hGetAll(`ip:stats:${ip}`);
    pipeline.hGetAll(`ip:endpoints:${ip}`);
    pipeline.hGetAll(`ip:payload:${ip}`);
    pipeline.zRangeWithScores(`ip:timeline:${ip}`, -50, -1);
    const results = await pipeline.exec();
    if (!results) {
        throw new Error("Redis pipeline failed");
    }
    const rpm = results[0] ?? 0;
    const stats = results[1] ?? {};
    const endpoints = results[2] ?? {};
    const payloads = results[3] ?? {};
    const timeline = results[4] ?? [];
    return {
        rpm,
        stats,
        endpoints,
        payloads,
        timeline
    };
}
//# sourceMappingURL=ipRawData.js.map