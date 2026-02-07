import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import apiMetadata from "./middleware/middlware.js";

const app = express();

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

app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
