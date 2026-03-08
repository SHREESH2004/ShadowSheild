import { client } from "../../config/redis.js";
const IP_WINDOW = 60;
const MAX_RPM = 150;
const MAX_CV = 2;
const MAX_BYTES = 52428800;
export const writeIPData = async (data) => {
    const timestamp = Date.now().toString();
    const isError = data.statusCode >= 400;
    await Promise.all([
        client.lpush(`ip:${data.ip}:timestamps`, timestamp),
        client.expire(`ip:${data.ip}:timestamps`, IP_WINDOW),
        client.hincrby(`ip:${data.ip}:endpoints`, data.endpoint, 1),
        client.expire(`ip:${data.ip}:endpoints`, IP_WINDOW),
        client.incr(`ip:${data.ip}:total`),
        client.expire(`ip:${data.ip}:total`, IP_WINDOW),
        client.incrby(`ip:${data.ip}:bytes`, data.responseSize),
        client.expire(`ip:${data.ip}:bytes`, IP_WINDOW),
        ...(isError ? [
            client.incr(`ip:${data.ip}:errors`),
            client.expire(`ip:${data.ip}:errors`, IP_WINDOW),
        ] : [])
    ]);
};
//# sourceMappingURL=ipEngine.js.map