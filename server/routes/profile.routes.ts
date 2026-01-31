import { Router } from "express";
import { storage } from "../storage";
import { createLogger } from "../utils/logger";
import { UserService } from "../services/user.service";

const logger = createLogger('ProfileRoutes');
const router = Router();

router.get("/", (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve user profile" });
  }
});

router.put("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const updateData = req.body;
    
    const allowedFields = ['fullName', 'email', 'phoneNumber', 'avatarUrl'];
    const filteredUpdateData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce<Record<string, any>>((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});
    
    const updatedUser = await UserService.updateUser(userId, filteredUpdateData);
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update user profile" });
  }
});

router.get("/permissions", (req, res) => {
  const role = req.user!.role;
  const permissions: Record<string, string[]> = {
    Admin: ['can_view_dashboard', 'can_create_user', 'can_delete_user', 'can_update_user', 'can_view_reports', 'can_manage_items', 'can_view_payments', 'can_manage_settings'],
    Agent: ['can_view_dashboard', 'can_view_reports', 'can_manage_items', 'can_view_payments'],
    Subscriber: ['can_view_dashboard', 'can_manage_own_items', 'can_create_reports', 'can_view_own_payments']
  };
  res.json({ role, permissions: permissions[role] || [] });
});

router.get("/preferences", (req, res) => {
  res.json({
    theme: 'system',
    layout: 'default',
    cardDensity: 'comfortable',
    widgetFavorites: [],
    notifications: { email: true, inApp: true }
  });
});

export default router;
