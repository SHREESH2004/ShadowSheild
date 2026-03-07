import express from "express";
import apiRoutes from "./routes/api.route.js";
import downloadRoutes from "./routes/download.routes.js";
const app = express();
app.use(express.json());
app.use("/api", apiRoutes);
app.use("/download", downloadRoutes);
export default app;
//# sourceMappingURL=app.js.map