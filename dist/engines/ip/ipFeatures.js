import { redisClient } from "../../redis_client/redis_client.js";
export async function getRequestsPerMinute(ip) {
    return await redisClient.zCard(`ip:timeline:${ip}`);
}
export async function getErrorRate(ip) {
    const stats = await redisClient.hGetAll(`ip:stats:${ip}`);
    const total = parseInt(stats.totalRequests || "1");
    const errors = parseInt(stats.errorCount || "0");
    return errors / total;
}
export async function getTotalBytesMB(ip) {
    const stats = await redisClient.hGetAll(`ip:stats:${ip}`);
    const bytes = parseInt(stats.totalBytes || "0");
    return bytes / (1024 * 1024);
}
export async function getEndpointEntropy(ip) {
    const endpoints = await redisClient.hGetAll(`ip:endpoints:${ip}`);
    const values = Object.values(endpoints).map(Number);
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0)
        return 0;
    let entropy = 0;
    for (const count of values) {
        const p = count / total;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}
export async function getRepeatRate(ip) {
    const payloads = await redisClient.hGetAll(`ip:payload:${ip}`);
    const values = Object.values(payloads).map(Number);
    if (values.length === 0)
        return 0;
    const total = values.reduce((a, b) => a + b, 0);
    const max = Math.max(...values);
    return max / total;
}
export async function getCVGap(ip) {
    const timestamps = await redisClient.zRangeWithScores(`ip:timeline:${ip}`, 0, -1);
    if (timestamps.length < 2)
        return 0;
    const times = timestamps.map(t => t.score);
    const gaps = [];
    for (let i = 1; i < times.length; i++) {
        gaps.push(times[i] - times[i - 1]);
    }
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length;
    const std = Math.sqrt(variance);
    return std / mean;
}
//# sourceMappingURL=ipFeatures.js.map