export interface SessionStructure {
    sessionId: string;
    endpoint: string;
    statusCode: number;
}
export declare const writeSessionData: (data: SessionStructure) => Promise<void>;
export declare const SessionFeature: (sessionId: String) => Promise<{
    rpm: number;
    entropy: number;
    cvGap: number;
    vector: number[];
}>;
export declare const SessionRiskScore: (sessionId: string) => Promise<number>;
export declare const getSessionScore: (sessionId: string) => Promise<number>;
//# sourceMappingURL=session.engine.d.ts.map