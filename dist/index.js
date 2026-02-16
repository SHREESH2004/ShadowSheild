import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import client, { connectRedis } from "./redis_client/redis_client.js";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
await connectRedis();
app.get("/api/data", async (req, res) => {
    try {
        const cache = await client.get("api_data");
        if (cache) {
            return res.json(JSON.parse(cache));
        }
        await new Promise(r => setTimeout(r, 200));
        const data = { message: "This is some API data" };
        await client.setEx("api_data", 60, JSON.stringify(data));
        res.json(data);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal error" });
    }
});
app.get("/download/:file", (req, res) => {
    const filePath = path.join(__dirname, "files", req.params.file);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
    }
    res.download(filePath);
});
app.get("/admin/suspicious", async (req, res) => {
    res.json();
});
process.on("SIGINT", async () => {
    console.log("🛑 Shutting down server...");
    await client.quit();
    process.exit(0);
});
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
//# sourceMappingURL=index.js.map