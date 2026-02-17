import { Request, Response } from "express";
import { getIPRawData } from "../../engines/ip/ipRawData.js";
import { ipEngine } from "../../engines/ip/ipEngine.js";

export async function getIPDetails(req: Request, res: Response) {
  try {
    const { ip } = req.params;

    if (!ip) {
      return res.status(400).json({ message: "IP required" });
    }

    const ipString = Array.isArray(ip) ? ip[0] : ip;
    const raw = await getIPRawData(ipString);
    const risk = await ipEngine(ipString);

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

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch IP details" });
  }
}