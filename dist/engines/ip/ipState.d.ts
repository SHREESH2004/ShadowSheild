interface UpdateIPStateInput {
    ip: string;
    endpoint: string;
    status: number;
    latency: number;
    bytes: number;
    payloadHash?: string;
}
export declare function updateIPState(data: UpdateIPStateInput): Promise<void>;
export {};
//# sourceMappingURL=ipState.d.ts.map