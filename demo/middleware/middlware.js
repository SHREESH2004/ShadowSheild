const suspiciousMap = new Map();
const suspiciousEvents = [];

setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of suspiciousMap) {
        if (now - data.lastSeen > 10 * 60 * 1000) {
            suspiciousMap.delete(ip);
        }
    }
}, 5 * 60 * 1000);

export default function apiMetadata(req, res, next) {
    const start = Date.now();
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

        const latency = Date.now() - start;

        const record = suspiciousMap.get(ip) || {
            count: 0,
            slow: 0,
            bytes: 0,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            flagged: false,
            flaggedAt: null
        };

        record.count++;
        record.bytes += bytesSent;
        if (latency > 2000) record.slow++;
        record.lastSeen = Date.now();

        suspiciousMap.set(ip, record);

        if (
            !record.flagged &&
            (
                record.slow >= 5 ||
                record.count >= 100 ||
                record.bytes >= 50 * 1024 * 1024
            )
        ) {
            record.flagged = true;
            record.flaggedAt = Date.now();

            req.isSuspicious = true;

            suspiciousEvents.push({
                ip,
                totalRequests: record.count,
                slowRequests: record.slow,
                totalBytesMB: +(record.bytes / (1024 * 1024)).toFixed(2),
                firstSeen: record.firstSeen,
                flaggedAt: record.flaggedAt
            });
        }

        return originalEnd.apply(res, arguments);
    };

    next();
}

export { suspiciousEvents };
