const suspiciousMap = new Map();
const suspiciousEvents = [];

const toISO = (t) => new Date(t).toISOString();
const bytesToKB = (b) => +(b / 1024).toFixed(2);
const bytesToMB = (b) => +(b / (1024 * 1024)).toFixed(2);

setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of suspiciousMap) {
        if (now - data.lastSeen > 10 * 60 * 1000) {
            suspiciousMap.delete(ip);
        }
    }
}, 5 * 60 * 1000); 

export default function apiMetadata(req, res, next) {
    const startTime = Date.now();
    let bytesSent = 0;
    const ip = req.ip;

    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (chunk) {
        if (chunk) bytesSent += Buffer.byteLength(chunk);
        return originalWrite.apply(res, arguments);
    };

    res.end = function (chunk) {
        if (chunk) bytesSent += Buffer.byteLength(chunk);

        const latencyMs = Date.now() - startTime;

        const record = suspiciousMap.get(ip) || {
            count: 0,
            slow: 0,
            bytes: 0,
            totalLatency: 0,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            flagged: false,
            flaggedAt: null
        };

        /* ---------- accumulate ---------- */
        record.count += 1;
        record.bytes += bytesSent;
        record.totalLatency += latencyMs;
        if (latencyMs > 2000) record.slow += 1;
        record.lastSeen = Date.now();

        suspiciousMap.set(ip, record);
        if (
            !record.flagged &&
            (
                record.count >= 100 ||
                record.slow >= 5 ||
                record.bytes >= 50 * 1024 * 1024
            )
        ) {
            record.flagged = true;
            record.flaggedAt = Date.now();
            req.isSuspicious = true;

            const windowSeconds = Math.max(
                1,
                Math.floor((record.lastSeen - record.firstSeen) / 1000)
            );

            suspiciousEvents.push({
                ip,

                totalRequests: record.count,
                requestsPerSecond: +(record.count / windowSeconds).toFixed(2),

                slowRequests: record.slow,

                totalBytes: record.bytes,
                totalKB: bytesToKB(record.bytes),
                totalMB: bytesToMB(record.bytes),

                averageLatencyMs: +(record.totalLatency / record.count).toFixed(2),

                firstSeen: toISO(record.firstSeen),
                lastSeen: toISO(record.lastSeen),
                flaggedAt: toISO(record.flaggedAt),

                observationWindowSeconds: windowSeconds
            });
        }

        return originalEnd.apply(res, arguments);
    };

    next();
}

export { suspiciousEvents };
