import { Redis } from "ioredis";

export const client = new Redis({
    host: "127.0.0.1",
    port: 6379
})

client.on("connect", () => {
    console.log("Redis client connected")
})

client.on("error", (err: Error) => {
    console.error("Redis error", err)
})