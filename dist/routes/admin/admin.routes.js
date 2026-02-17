import express from "express";
import { getIPDetails } from "./admin.controller.js";
const router = express.Router();
router.get("/ip/:ip", getIPDetails);
export default router;
//# sourceMappingURL=admin.routes.js.map