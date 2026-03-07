import app from "./app.js";
import { client } from "./config/redis.js";
const PORT = 3000;
const startServer = async () => {
    try {
        await client.ping();
        console.log("✅ Redis connected");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map