import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";

const router = Router();

const filesDirectory = path.resolve("src/files");

router.get("/:file", (req: Request, res: Response) => {
  const requestedPath = path.resolve(filesDirectory, req.params.file as string);

  if (!requestedPath.startsWith(filesDirectory)) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!fs.existsSync(requestedPath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(requestedPath);
});

export default router;