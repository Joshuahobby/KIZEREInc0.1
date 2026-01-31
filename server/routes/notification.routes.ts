import { Router } from "express";
import { storage } from "../storage";
import { createLogger } from "../utils/logger";

const logger = createLogger('NotificationRoutes');
const router = Router();

// Notifications API
router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const notifications = await storage.getUserNotifications(userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.post("/:id/read", async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    
    const notification = await storage.getNotification(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updated = await storage.markNotificationAsRead(notificationId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification" });
  }
});

export default router;
