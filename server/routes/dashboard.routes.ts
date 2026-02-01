import { Router } from "express";
import { dashboardService } from "../services/dashboard.service";
import { createLogger } from "../utils/logger";

const logger = createLogger('DashboardRoutes');
const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    
    const stats = await dashboardService.getUserDashboardStats(userId, role as any);
    res.json(stats);
  } catch (error) {
    logger.error('Failed to fetch dashboard stats', { userId: req.user?.id, error });
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

export default router;
