import { getIPRawData } from "./ipRawData.js";
function normalize(value, min, max) {
    if (value <= min)
        return 0;
    if (value >= max)
        return 1;
    return (value - min) / (max - min);
}
export async function ipEngine(ip) {
    const raw = await getIPRawData(ip);
    const total = parseInt(raw.stats.totalRequests ?? "1");
    const errors = parseInt(raw.stats.errorCount ?? "0");
    const bytes = parseInt(raw.stats.totalBytes ?? "0");
    const errorRate = errors / total;
    const bytesMB = bytes / (1024 * 1024);
    const endpointValues = Object.values(raw.endpoints).map(Number);
    const endpointTotal = endpointValues.reduce((a, b) => a + b, 0);
    let entropy = 0;
    if (endpointTotal > 0) {
        for (const count of endpointValues) {
            const p = count / endpointTotal;
            entropy -= p * Math.log2(p);
        }
    }
    const payloadValues = Object.values(raw.payloads).map(Number);
    const payloadTotal = payloadValues.reduce((a, b) => a + b, 0);
    const maxPayload = Math.max(...payloadValues, 0);
    const repeatRate = payloadTotal === 0 ? 0 : maxPayload / payloadTotal;
    let cv = 0;
    if (raw.timeline.length > 1) {
        const times = raw.timeline.map(t => t.score);
        const gaps = [];
        for (let i = 1; i < times.length; i++) {
            gaps.push(times[i] - times[i - 1]);
        }
        const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const variance = gaps.reduce((a, b) => a + (b - mean) ** 2, 0) /
            gaps.length;
        const std = Math.sqrt(variance);
        cv = std / mean;
    }
    const risk = 0.25 * normalize(raw.rpm, 0, 200) +
        0.20 * errorRate +
        0.15 * normalize(bytesMB, 0, 100) +
        0.15 * repeatRate +
        0.15 * (1 - cv) +
        0.10 * (1 - entropy / 4);
    return Math.min(1, risk);
}
//# sourceMappingURL=ipEngine.js.map