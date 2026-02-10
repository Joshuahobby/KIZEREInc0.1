import { storage } from "../storage";
import { createLogger } from "../utils/logger";

const logger = createLogger('ReputationService');

export class ReputationService {
    /**
     * Award points for successfully returning an item (Resolution)
     */
    static async awardResolutionPoints(userId: number) {
        try {
            const points = 50;
            const itemsReturnedDelta = 1;

            const updatedUser = await storage.updateUserReputation(userId, points, itemsReturnedDelta);

            if (updatedUser) {
                logger.info('Awarded resolution points', { userId, points, newScore: updatedUser.reputationScore });

                // Notify user of reputation gain
                await storage.createNotification({
                    userId,
                    title: "Reputation Boost! 🏆",
                    message: `You've earned ${points} reputation points for a successful return. Keep up the great work!`,
                    type: 'admin_alert',
                    isRead: false
                });

                // Check for "Trusted" status promotion (already handled in storage/user.storage.ts but we can add more logic here if needed)
            }
            return updatedUser;
        } catch (error) {
            logger.error('Failed to award resolution points', { userId, error });
        }
    }

    /**
     * Award points for verifying a claim (First step in honest return)
     */
    static async awardVerificationPoints(userId: number) {
        try {
            const points = 10;
            const updatedUser = await storage.updateUserReputation(userId, points, 0);

            if (updatedUser) {
                logger.info('Awarded verification points', { userId, points, newScore: updatedUser.reputationScore });
            }
            return updatedUser;
        } catch (error) {
            logger.error('Failed to award verification points', { userId, error });
        }
    }
}
