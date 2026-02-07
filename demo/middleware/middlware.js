export default function apiMetadata(req, res, next) {
    const startTime = Date.now();
    let bytesSent = 0;

    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (chunk) {
        if (chunk) {
            bytesSent += Buffer.byteLength(chunk);
        }
        return originalWrite.apply(res, arguments);
    };

    res.end = function (chunk) {
        if (chunk) {
            bytesSent += Buffer.byteLength(chunk);
        }

        console.log("📊 API METADATA", {
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            downloadedBytes: bytesSent,
            latencyMs: Date.now() - startTime,
            time: new Date().toISOString()
        });

        return originalEnd.apply(res, arguments);
    };

    next();
}
