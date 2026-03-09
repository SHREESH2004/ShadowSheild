import { Redis } from "ioredis";
export interface SessionStructure {
    sessionId: string;
    endpoint: string;
    statusCode: number;
    ip: string;
}
export declare const writeSessionData: (data: SessionStructure, redis: Redis) => Promise<void>;
export declare const SessionFeature: (sessionId: string, redis: Redis) => Promise<{
    rpm: number;
    entropy: number;
    cvGap: number;
    vector: number[];
}>;
export declare const SessionRiskScore: (sessionId: string, redis: Redis) => Promise<number>;
//# sourceMappingURL=session.engine.d.ts.map