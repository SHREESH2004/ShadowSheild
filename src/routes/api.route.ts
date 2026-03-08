import { Router, Request, Response } from "express";
import { redisClient } from "../redis_client/redis_client.js";

const router = Router();

router.get("/data", async (_req: Request, res: Response) => {
    try {
        const data = { message: "This is some API data" };
        return res.json(data);
    } catch (error) {
        console.error("[/api/data]", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;