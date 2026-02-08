import express from "express";
import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

import apiMetadata, { suspiciousEvents } from "./middleware/middlware.js";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(apiMetadata);

app.get("/api/data", (req, res) => {
    res.json({
        message: "This is some API data",
        items: [1, 2, 3, 4, 5]
    });
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

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

const TEST_URL = "http://localhost:3000/api/data";
const TOTAL_REQUESTS = 100;

function sendRequest() {
    return new Promise((resolve) => {
        http.get(TEST_URL, (res) => {
            res.on("data", () => {});
            res.on("end", resolve);
        }).on("error", resolve);
    });
}

async function attack() {
    for (let i = 1; i <= TOTAL_REQUESTS; i++) {
        await sendRequest();
    }
}

attack();
