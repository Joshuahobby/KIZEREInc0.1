import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createLogger } from '../utils/logger';
import { uploadImage, uploadPrivateImage, getUrlWithSignature } from '../services/cloudinary.service';
import { storage } from '../storage';
import { z } from 'zod';
import { insertVerificationRequestSchema } from '@shared/schema';
import { sendAdminVerificationNotification, sendUserVerificationStatusEmail } from '../services/email.service';
import crypto from 'crypto';

const router = Router();
const logger = createLogger('VerificationRoutes');

/**
 * GET /api/verification/liveness-code
 * Generate a random code for the user to hold during verification
 */
router.get('/liveness-code', (req: Request, res: Response) => {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  // Store in session for validation upon submission
  (req.session as any).livenessCode = code;
  res.json({ code });
});

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

/**
 * POST /api/verification
 * Submit verification documents (Private Storage + Liveness Check)
 */
router.post(
  '/',
  upload.fields([{ name: 'document', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        logger.warn('Verification submission attempt without req.user');
        return res.status(401).json({ message: 'Authentication required' });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { documentType, livenessCode } = req.body;

      logger.info('Starting verification submission', { 
        userId: req.user.id, 
        documentType,
        hasDocument: !!files?.document?.[0],
        hasSelfie: !!files?.selfie?.[0],
        hasLivenessCode: !!livenessCode
      });

      if (!files?.document?.[0] || !files?.selfie?.[0]) {
        logger.warn('Submission failed: Missing files');
        return res.status(400).json({ message: 'Both document and selfie are required' });
      }

      if (!['nid', 'passport', 'drivers_license'].includes(documentType)) {
        logger.warn('Submission failed: Invalid document type', { documentType });
        return res.status(400).json({ message: 'Invalid document type' });
      }

      // Verify liveness code if provided
      const expectedCode = (req.session as any).livenessCode;
      logger.info('Verifying liveness code', { expectedCode, providedCode: livenessCode });
      if (expectedCode && livenessCode !== expectedCode) {
        logger.warn('Submission failed: Liveness code mismatch');
        return res.status(400).json({ message: 'Invalid liveness code' });
      }

      // Upload to Cloudinary as PRIVATE
      logger.info('Uploading document to Cloudinary...');
      const docBase64 = `data:${files.document[0].mimetype};base64,${files.document[0].buffer.toString('base64')}`;
      const docUpload = await uploadPrivateImage(docBase64, 'kizere/private/docs');
      logger.info('Document uploaded successfully', { publicId: docUpload.publicId });

      logger.info('Uploading selfie to Cloudinary...');
      const selfieBase64 = `data:${files.selfie[0].mimetype};base64,${files.selfie[0].buffer.toString('base64')}`;
      const selfieUpload = await uploadPrivateImage(selfieBase64, 'kizere/private/selfies');
      logger.info('Selfie uploaded successfully', { publicId: selfieUpload.publicId });

      logger.info('Creating verification request in DB...');
      const request = await storage.createVerificationRequest({
        userId: req.user.id,
        documentType,
        documentUrl: docUpload.url,
        documentPublicId: docUpload.publicId,
        selfieUrl: selfieUpload.url,
        selfiePublicId: selfieUpload.publicId,
        livenessCode: livenessCode || null,
      });

      // Clear the liveness code from session
      delete (req.session as any).livenessCode;

      // Notify admins via email (ignore errors here to not block user)
      try {
        const admins = await storage.getUsersByRole(['Admin', 'Moderator']);
        for (const admin of admins) {
          if (admin.email) {
            sendAdminVerificationNotification(
              admin.email,
              req.user.id,
              req.user.fullName || 'User'
            ).catch(err => logger.error('Failed to send admin verification email', { error: err.message }));
          }
        }
      } catch (adminErr: any) {
        logger.error('Error during admin notification', { error: adminErr.message });
      }

      logger.info('Verification request completed', { userId: req.user.id, requestId: request.id });
      res.status(201).json(request);

    } catch (error: any) {
      logger.error('Verification submission failed', { 
        userId: req.user?.id,
        error: error.message,
        stack: error.stack,
        details: error.details
      });
      res.status(500).json({ 
        message: 'Failed to submit verification', 
        debug: error.message,
        errorId: crypto.randomUUID()
      });
    }
  }
);

/**
 * GET /api/verification/status
 * Get current user's verification status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      logger.warn('Status check called without req.user');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    logger.info('Fetching verification status', { userId: req.user.id });
    const request = await storage.getVerificationRequest(req.user.id);
    res.json(request || { status: 'none' });
  } catch (error: any) {
    logger.error('Failed to fetch verification status', { 
      userId: req.user?.id,
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ message: 'Failed to fetch status', debug: error.message });
  }
});

/**
 * GET /api/verification/admin/list
 * List pending requests with SIGNED URLs for private documents
 */
router.get('/admin/list', async (req: Request, res: Response) => {
  try {
    const isInternal = ['Admin', 'Agent', 'Moderator'].includes(req.user!.role);
    if (!isInternal) {
      return res.status(403).json({ message: 'Forbidden: Internal access required' });
    }
    const requests = await storage.getPendingVerificationRequests();
    
    // Generate signed URLs for private viewing
    const enrichedRequests = requests.map(r => ({
      ...r,
      documentUrl: r.documentPublicId ? getUrlWithSignature(r.documentPublicId) : r.documentUrl,
      selfieUrl: r.selfiePublicId ? getUrlWithSignature(r.selfiePublicId) : r.selfieUrl
    }));

    res.json(enrichedRequests);
  } catch (error) {
    logger.error('Failed to fetch verification requests', { error });
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

/**
 * POST /api/verification/admin/:id/review
 * Approve or Reject (Admin/Agent/Moderator only)
 */
router.post('/admin/:id/review', async (req: Request, res: Response) => {
  try {
    const isInternal = ['Admin', 'Agent', 'Moderator'].includes(req.user!.role);
    if (!isInternal) {
      return res.status(403).json({ message: 'Forbidden: Internal access required' });
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

    // Emit real-time update via WebSocket
    try {
      const { emitToUser } = await import('../websocket');
      emitToUser(updated.userId, 'VERIFICATION_STATUS_CHANGED', {
        status: updated.status,
        requestId: updated.id,
        comment: updated.adminComment
      });
      logger.info('WebSocket status update emitted', { userId: updated.userId, status: updated.status });
    } catch (wsErr: any) {
      logger.error('Failed to emit WebSocket status update', { error: wsErr.message });
    }

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

/**
 * POST /api/verification/verify-direct
 * Direct verification by Agent on the field (No document upload required)
 */
router.post('/verify-direct', async (req: Request, res: Response) => {
  try {
    const isInternal = ['Admin', 'Agent'].includes(req.user!.role);
    if (!isInternal) {
      return res.status(403).json({ message: 'Forbidden: Internal access required' });
    }

    const { userId, documentType, comment } = req.body;
    if (!userId || !documentType) {
      return res.status(400).json({ message: 'User ID and document type are required' });
    }

    const targetUser = await storage.getUser(parseInt(userId));
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Directly update user verification status
    await storage.updateUserVerificationStatus(targetUser.id, 'approved');
    
    // Create a record in verification_requests for audit trail
    await storage.createVerificationRequest({
      userId: targetUser.id,
      documentType,
      documentUrl: 'DIRECT_FIELD_VERIFICATION',
      selfieUrl: 'DIRECT_FIELD_VERIFICATION',
      status: 'approved',
      adminComment: comment || 'Verified directly by agent in the field',
      reviewedBy: req.user!.id,
      reviewedAt: new Date()
    } as any);

    // Create activity log
    await storage.createUserActivityLog({
      userId: req.user!.id,
      action: 'direct_user_verification',
      details: {
        targetUserId: targetUser.id,
        targetUsername: targetUser.username,
        comment
      },
      ipAddress: (req.ip as string) || null,
      userAgent: req.headers['user-agent'] || null
    });

    if (targetUser.email) {
      sendUserVerificationStatusEmail(
        targetUser.email,
        targetUser.fullName || 'User',
        'approved',
        'Your identity has been verified by our field agent.'
      ).catch(err => logger.error('Failed to send verification status email', { error: err }));
    }

    res.json({ success: true, message: 'User verified successfully' });
  } catch (error) {
    logger.error('Direct verification failed', { error });
    res.status(500).json({ message: 'Failed to verify user' });
  }
});

export default router;
