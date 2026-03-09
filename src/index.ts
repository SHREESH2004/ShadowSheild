import app          from "./app.js"
import { client }   from "./config/redis.js"
import { db }       from "./config/postgres.js"
import { createTables }  from "./config/schema.js"
import { syncBlockedIps } from "./cron/blocked_ip.cron.js"

const PORT = process.env.PORT || 3000

const startServer = async () => {
    try {
        await client.ping()
        console.log("✅ Redis connected")

        await db.query("SELECT 1")
        console.log("✅ Postgres connected")

        await createTables()
        console.log("✅ Tables ready")

        syncBlockedIps()
        console.log("✅ Cron jobs started")

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`)
        })

    } catch (error) {
        console.error("❌ Failed to start server:", error)
        process.exit(1)
    }
}

startServer()