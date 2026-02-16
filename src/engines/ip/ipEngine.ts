import {
    getRequestsPerMinute,
    getErrorRate,
    getTotalBytesMB,
    getEndpointEntropy,
    getRepeatRate,
    getCVGap
} from "./ipFeatures.js"

function normalize(value: number, min: number, max: number): number {
    if (value <= min) return 0;
    if (value >= max) return 1;
    return (value - min) / (max - min);
}

export async function ipEngine(ip: string): Promise<number> {
    const [
        rpm,
        errorRate,
        bytesMB,
        entropy,
        repeatRate,
        cv
    ] = await Promise.all([
        getRequestsPerMinute(ip),
        getErrorRate(ip),
        getTotalBytesMB(ip),
        getEndpointEntropy(ip),
        getRepeatRate(ip),
        getCVGap(ip)
    ]);

    const risk =
        0.25 * normalize(rpm, 0, 200) +
        0.20 * errorRate +
        0.15 * normalize(bytesMB, 0, 100) +
        0.15 * repeatRate +
        0.15 * (1 - cv) +
        0.10 * (1 - entropy / 4);

    return Math.min(1, risk);
}