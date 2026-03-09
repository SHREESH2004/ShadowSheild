import express from "express";
import session from "express-session";
import apiRoutes from "./routes/api.route.js";
import downloadRoutes from "./routes/download.routes.js";
import { shadowShield } from "./middleware/shadowsheild.js";
const app = express();
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || "shadowshield-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60
    }
}));
app.use(shadowShield({
    redisHost: process.env.REDIS_HOST || "127.0.0.1",
    redisPort: parseInt(process.env.REDIS_PORT || "6379"),
    threshold: 0.7,
    blockTTL: 3600
}));
app.use("/api", apiRoutes);
app.use("/download", downloadRoutes);
export default app;
//# sourceMappingURL=app.js.map