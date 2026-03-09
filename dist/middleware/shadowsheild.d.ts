import { Request, Response, NextFunction } from "express";
export interface ShadowShieldOptions {
    redisUrl?: string;
    redisHost?: string;
    redisPort?: number;
    redisPassword?: string;
    threshold?: number;
    blockTTL?: number;
}
export declare const shadowShield: (options?: ShadowShieldOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=shadowsheild.d.ts.map