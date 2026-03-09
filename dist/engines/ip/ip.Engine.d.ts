import { Redis } from "ioredis";
export interface ipstructure {
    ip: string;
    endpoint: string;
    statusCode: number;
    responseSize: number;
}
export declare const writeIPData: (data: ipstructure, redis: Redis) => Promise<void>;
export declare const IPFeatures: (ip: string, redis: Redis) => Promise<{
    rpm: number;
    errorRate: number;
    entropy: number;
    cvGap: number;
    volumeMb: number;
    vector: number[];
}>;
export declare const IPRiskScore: (ip: string, redis: Redis) => Promise<number>;
//# sourceMappingURL=ip.Engine.d.ts.map