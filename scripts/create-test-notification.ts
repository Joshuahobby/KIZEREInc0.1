import { db } from "../server/db";
import { notifications } from "../shared/schema";
import { eq } from "drizzle-orm";

async function createTestNotification() {
  const userId = 14; // Valid user ID 14
  
  await db.insert(notifications).values({
    userId,
    title: "Test Notification",
    message: "This is a test notification for verification.",
    type: "system",
    isRead: false
  });
  
  console.log("Created test notification for user 1");
  process.exit(0);
}

createTestNotification().catch(err => {
  console.error(err);
  process.exit(1);
});
