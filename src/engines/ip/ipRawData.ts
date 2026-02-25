import { redisClient } from "../../redis_client/redis_client.js";

interface IPStats {
  totalRequests?: string;
  errorCount?: string;
  totalBytes?: string;
  totalLatency?: string;
}
export async function getIPRawData(ip: string) {
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

  const rpm = (results[0] as unknown as number) ?? 0;

  const stats =
    (results[1] as IPStats) ?? {};

  const endpoints =
    (results[2] as unknown as Record<string, string>) ?? {};

  const payloads =
    (results[3] as unknown as Record<string, string>) ?? {};

  const timeline =
    (results[4] as unknown as { score: number }[]) ?? [];

  return {
    rpm,
    stats,
    endpoints,
    payloads,
    timeline
  };
}