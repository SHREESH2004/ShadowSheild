import { db } from "./postgres.js";
export const createTables = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS blocked_ips (
            id            SERIAL PRIMARY KEY,
            ip            VARCHAR(45) NOT NULL UNIQUE,
            risk_score    FLOAT       NOT NULL,
            blocked_at    TIMESTAMP   DEFAULT NOW(),
            expires_at    TIMESTAMP,
            reason        VARCHAR(255),
            request_count INT         DEFAULT 0
        )
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS request_logs (
            id          SERIAL PRIMARY KEY,
            ip          VARCHAR(45),
            endpoint    VARCHAR(255),
            risk_score  FLOAT,
            status_code INT,
            logged_at   TIMESTAMP DEFAULT NOW()
        )
    `);
    console.log("Tables created");
};
//# sourceMappingURL=schema.js.map