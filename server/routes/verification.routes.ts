import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createLogger } from '../utils/logger';
import { uploadImage } from '../services/cloudinary.service';
import { storage } from '../storage';
import { z } from 'zod';
import { insertVerificationRequestSchema } from '@shared/schema';
import { sendAdminVerificationNotification, sendUserVerificationStatusEmail } from '../services/email.service';

const router = Router();
const logger = createLogger('VerificationRoutes');

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware to check if user is admin - assuming requireAdmin is available globally or needs import
// We'll trust routes.ts to mount this with appropriate checks if needed, but best to checks inside.
// Actually routes.ts mounts /api/reports with requireAuth.
// We should check roles inside handler for admin routes.

/**
 * POST /api/verification
 * Submit verification documents
 */
router.post(
  '/',
  upload.fields([{ name: 'document', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files?.document?.[0] || !files?.selfie?.[0]) {
        return res.status(400).json({ message: 'Both document and selfie are required' });
      }

      const documentType = req.body.documentType;
      if (!['nid', 'passport', 'drivers_license'].includes(documentType)) {
        return res.status(400).json({ message: 'Invalid document type' });
      }

      // Upload to Cloudinary
      const docBase64 = `data:${files.document[0].mimetype};base64,${files.document[0].buffer.toString('base64')}`;
      const selfieBase64 = `data:${files.selfie[0].mimetype};base64,${files.selfie[0].buffer.toString('base64')}`;
      // actually `data:${...};base64,${...}`

      const docUpload = await uploadImage(docBase64, 'kizere/verification/docs');
      const selfieUpload = await uploadImage(
        `data:${files.selfie[0].mimetype};base64,${files.selfie[0].buffer.toString('base64')}`,
        'kizere/verification/selfies'
      );

      const request = await storage.createVerificationRequest({
        userId: req.user!.id,
        documentType,
        documentUrl: docUpload.url,
        selfieUrl: selfieUpload.url,
        // status is pending by default
      });

      // Notify admins via email
      const admins = await storage.getUsersByRole(['Admin', 'Moderator']);
      for (const admin of admins) {
        if (admin.email) {
          sendAdminVerificationNotification(
            admin.email,
            req.user!.id,
            req.user!.fullName || 'User'
          ).catch(err => logger.error('Failed to send admin verification email', { error: err }));
        }
      }

      logger.info('Verification request created', { userId: req.user!.id, requestId: request.id });
      res.json(request);

    } catch (error) {
      logger.error('Verification submission failed', { error });
      res.status(500).json({ message: 'Failed to submit verification' });
    }
  }
);

/**
 * GET /api/verification/status
 * Get current user's verification status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const request = await storage.getVerificationRequest(req.user!.id);
    res.json(request || { status: 'none' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch status' });
  }
});

/**
 * GET /api/admin/verifications
 * List pending requests (Admin only)
 */
router.get('/admin/list', async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    const requests = await storage.getPendingVerificationRequests();
    res.json(requests);
  } catch (error) {
    logger.error('Failed to fetch verification requests', { error });
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

/**
 * POST /api/admin/verifications/:id/review
 * Approve or Reject (Admin only)
 */
router.post('/admin/:id/review', async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { status, comment } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await storage.updateVerificationRequestStatus(
      parseInt(req.params.id),
      status,
      req.user!.id,
      comment
    );

    if (!updated) return res.status(404).json({ message: 'Request not found' });

    // Send email notification (Verification approved/rejected)
    const targetUser = await storage.getUser(updated.userId);
    if (targetUser?.email) {
      sendUserVerificationStatusEmail(
        targetUser.email,
        targetUser.fullName || 'User',
        status as 'approved' | 'rejected',
        comment
      ).catch(err => logger.error('Failed to send verification status email', { error: err }));
    }

    logger.info(`Sending email notification for verification ${status} to User ID: ${updated.userId}`);

    res.json(updated);
  } catch (error) {
    logger.error('Review failed', { error });
    res.status(500).json({ message: 'Failed to review request' });
  }
});

export default router;
