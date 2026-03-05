import express from "express";
import apiRoutes from "./routes/api.route.js"
import downloadRoutes from "./routes/download.routes.js"

import adminRoutes from "./routes/admin/admin.routes.js"
const app = express();

app.use(express.json());

app.use("/api", apiRoutes);
app.use("/download", downloadRoutes);
app.use("/admin",adminRoutes);

export default app;