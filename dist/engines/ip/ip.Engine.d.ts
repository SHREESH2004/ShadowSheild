export interface ipstructure {
    ip: string;
    endpoint: string;
    statusCode: number;
    responseSize: number;
}
export declare const writeIPData: (data: ipstructure) => Promise<void>;
export declare const IPFeatures: (ip: string) => Promise<{
    rpm: number;
    errorRate: number;
    entropy: number;
    cvGap: number;
    volumeMb: number;
    vector: number[];
}>;
export declare const IPRiskScore: (ip: string) => Promise<number>;
export declare const getIPScore: (ip: string) => Promise<number>;
//# sourceMappingURL=ip.Engine.d.ts.map