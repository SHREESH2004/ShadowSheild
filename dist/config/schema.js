import { db } from "./postgres.js";
export const createTables = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS blocked_ips (
            id          SERIAL PRIMARY KEY,
            ip          VARCHAR(45) NOT NULL UNIQUE,
            risk_score  FLOAT       NOT NULL,
            blocked_at  TIMESTAMP   DEFAULT NOW(),
            reason      VARCHAR(255)
        )
    `);
    console.log("Tables created");
};
//# sourceMappingURL=schema.js.map