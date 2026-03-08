import { Router } from "express";
const router = Router();
router.get("/data", async (_req, res) => {
    try {
        const data = { message: "This is some API data" };
        return res.json(data);
    }
    catch (error) {
        console.error("[/api/data]", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
export default router;
//# sourceMappingURL=api.route.js.map