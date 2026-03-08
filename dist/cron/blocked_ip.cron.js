import nodeCron from "node-cron";
import { client } from "../config/redis.js";
import { db } from "../config/postgres.js";
export const syncBlockedIps = () => {
    nodeCron.schedule("*/1 * * * *", async () => {
        console.log("🔄 Cron: syncing blocked IPs...");
        try {
            const keys = await client.keys("block:*");
            if (keys.length === 0) {
                console.log("✅ Cron: no blocked IPs");
                return;
            }
            for (const key of keys) {
                const ip = key.replace("block:", "");
                const ttl = await client.ttl(key);
                const cached = await client.get(`risk:ip:${ip}`);
                const riskScore = cached ? parseFloat(cached) : 0.0;
                const expiresAt = new Date(Date.now() + ttl * 1000);
                await db.query(`
                    INSERT INTO blocked_ips
                        (ip, risk_score, expires_at, reason)
                    VALUES
                        ($1, $2, $3, $4)
                    ON CONFLICT (ip)
                    DO UPDATE SET
                        risk_score = EXCLUDED.risk_score,
                        expires_at = EXCLUDED.expires_at,
                        blocked_at = NOW()
                `, [ip, riskScore, expiresAt, "High risk score"]);
                console.log(`💾 Blocked IP saved: ${ip} | risk: ${riskScore}`);
            }
            console.log(`Cron: synced ${keys.length} blocked IPs`);
        }
        catch (err) {
            console.error("Cron error:", err);
        }
    });
};
//# sourceMappingURL=blocked_ip.cron.js.map