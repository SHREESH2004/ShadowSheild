import { getIPRawData } from "../../engines/ip/ipRawData.js";
import { ipEngine } from "../../engines/ip/ipEngine.js";
export async function getIPDetails(req, res) {
    try {
        const { ip } = req.params;
        if (!ip || typeof ip !== "string") {
            return res.status(400).json({ message: "IP required" });
        }
        const raw = await getIPRawData(ip);
        const risk = await ipEngine(ip);
        const total = parseInt(raw.stats.totalRequests ?? "0");
        const errors = parseInt(raw.stats.errorCount ?? "0");
        const bytes = parseInt(raw.stats.totalBytes ?? "0");
        const errorRate = total > 0 ? errors / total : 0;
        return res.json({
            ip,
            riskScore: risk,
            summary: {
                requestsPerMinute: raw.rpm,
                totalRequests: total,
                errorCount: errors,
                errorRate,
                totalBytesMB: bytes / (1024 * 1024),
            },
            rawData: raw
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch IP details" });
    }
}
//# sourceMappingURL=admin.service.js.map