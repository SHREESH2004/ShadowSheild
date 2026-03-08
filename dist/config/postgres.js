import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
export const db = new Pool({
    host: process.env.POSTGRES_HOST || "127.0.0.1",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "yourpassword",
    database: process.env.POSTGRES_DB || "shadowshield",
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
db.on("error", (err) => console.error("Postgres error", err));
//# sourceMappingURL=postgres.js.map