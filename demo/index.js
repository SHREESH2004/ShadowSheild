import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { suspiciousEvents } from "./middleware/middlware.js";

import apiMetadata from "./middleware/middlware.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(apiMetadata);

app.get("/api/data", async (req, res) => {
    await new Promise(r => setTimeout(r, Math.random() * 200));
    res.json({ message: "This is some API data" });
});


app.get("/download/:file", (req, res) => {
    const filePath = path.join(__dirname, "files", req.params.file);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
    }

    res.download(filePath);
});

app.get("/admin/suspicious", (req, res) => {
    res.json(suspiciousEvents);
});


app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
