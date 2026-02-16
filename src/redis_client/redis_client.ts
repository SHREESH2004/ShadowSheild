import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.REDIS_URL) {
  throw new Error("❌ REDIS_URL not defined in .env");
}

const client = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("❌ Redis retry attempts exhausted");
        return new Error("Retry attempts exhausted");
      }
      console.log(`🔁 Redis reconnect attempt #${retries}`);
      return Math.min(retries * 100, 3000);
    },
  },
});

client.on("connect", () => {
  console.log("🔌 Connecting to Redis...");
});

client.on("ready", () => {
  console.log("✅ Redis is ready");
});

client.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

client.on("end", () => {
  console.log("⚠️ Redis connection closed");
});

export async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

export default client;