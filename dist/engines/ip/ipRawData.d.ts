interface IPStats {
    totalRequests?: string;
    errorCount?: string;
    totalBytes?: string;
    totalLatency?: string;
}
export declare function getIPRawData(ip: string): Promise<{
    rpm: number;
    stats: IPStats;
    endpoints: Record<string, string>;
    payloads: Record<string, string>;
    timeline: {
        score: number;
    }[];
}>;
export {};
//# sourceMappingURL=ipRawData.d.ts.map