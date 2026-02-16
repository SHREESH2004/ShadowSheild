import app from "./app.js";
import { connectRedis, redisClient } from "./redis_client/redis_client.js";

const PORT = 3000;

const startServer = async () => {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

process.on("SIGINT", async () => {
  console.log("🛑 Graceful shutdown...");
  await redisClient.quit();
  process.exit(0);
});