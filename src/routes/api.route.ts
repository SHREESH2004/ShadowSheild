import { Router, Request, Response } from "express";
import { redisClient } from "../redis_client/redis_client.js";

const router = Router();

router.get("/data", async (_req: Request, res: Response) => {
  try {
    const cache = await redisClient.get("api_data");

    if (cache) {
      return res.json(JSON.parse(cache));
    }

    await new Promise((r) => setTimeout(r, 200));

    const data = { message: "This is some API data" };

    await redisClient.setEx("api_data", 60, JSON.stringify(data));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;