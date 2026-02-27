import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadImage, uploadImages, getUploadSignature, deleteImage } from '../services/cloudinary.service';
import { createLogger } from '../utils/logger';
import { validateUploadedFile } from '../utils/file-validation';
import { handleRequestError } from '../utils/error-handler';

const router = Router();
const logger = createLogger('UploadRoutes');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedMimeTypes = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (allowedMimeTypes.some(type => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Please upload images or documents (PDF, Word, Excel, TXT).'));
    }
  }
});

/**
 * POST /api/upload
 * Upload a single image
 * Phase 1.3: Added magic byte validation
 */
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Phase 1.3: Validate file by magic bytes
    if (req.file.mimetype.startsWith('image/')) {
      const validation = validateUploadedFile(req.file.buffer, req.file.mimetype);
      if (!validation.isValid) {
        logger.warn('File validation failed', {
          error: validation.error,
          claimed: req.file.mimetype,
          detected: validation.detectedMimeType
        });
        return res.status(400).json({
          message: validation.error || 'Invalid file format detected'
        });
      }
    }

    // Convert buffer to base64 data URI
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const folder = req.body.folder || 'kizere/uploads';
    const result = await uploadImage(base64, folder);

    logger.info('Image uploaded via API', { publicId: result.publicId });

    res.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    logger.error('Upload failed', { error });
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

/**
 * POST /api/upload/multiple
 * Upload multiple images
 */
router.post('/multiple', upload.array('images', 3), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    const folder = req.body.folder || 'kizere/uploads';

    const base64Images = files.map(file =>
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    );

    const results = await uploadImages(base64Images, folder);

    logger.info('Multiple images uploaded via API', { count: results.length });

    res.json({
      success: true,
      images: results.map(r => ({ url: r.url, publicId: r.publicId })),
    });
  } catch (error) {
    logger.error('Multiple upload failed', { error });
    handleRequestError(error, res);
  }
});

/**
 * POST /api/upload/images
 * Specialized endpoint for frontend item registration
 */
router.post('/images', (req: Request, res: Response, next: NextFunction) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      logger.error('Multer error while uploading images', {
        error: err.message,
        code: (err as any).code,
        field: (err as any).field
      });
      return res.status(400).json({
        message: err.message || 'Error processing uploaded files',
        code: (err as any).code
      });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      logger.warn('No image files provided in request');
      return res.status(400).json({ message: 'No image files provided' });
    }

    const folder = req.body.folder || 'kizere/items';
    const base64Images = files.map(file =>
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    );

    const results = await uploadImages(base64Images, folder);

    res.json({
      success: true,
      urls: results.map(r => r.url)
    });
  } catch (error) {
    logger.error('Images upload failed', { error });
    handleRequestError(error, res);
  }
});

/**
 * POST /api/upload/documents
 * Specialized endpoint for ownership documents
 */
router.post('/documents', upload.array('documents', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No document files provided' });
    }

    const folder = req.body.folder || 'kizere/documents';

    const uploadPromises = files.map(async (file, index) => {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const result = await uploadImage(base64, folder);

      // Try to get document info from request body if available
      let info = {};
      try {
        const infoStr = req.body[`documentInfo${index}`];
        if (infoStr) {
          info = JSON.parse(infoStr);
        }
      } catch (e) {
        logger.warn('Failed to parse document info', { index });
      }

      return {
        ...info,
        url: result.url,
        publicId: result.publicId,
        mimetype: file.mimetype,
        name: file.originalname
      };
    });

    const documents = await Promise.all(uploadPromises);

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    logger.error('Documents upload failed', { error });
    res.status(500).json({ message: 'Failed to upload documents' });
  }
});

/**
 * GET /api/upload/signature
 * Get a signed upload URL for direct browser uploads
 */
router.get('/signature', (req: Request, res: Response) => {
  try {
    const folder = (req.query.folder as string) || 'kizere/uploads';
    const signature = getUploadSignature(folder);
    res.json(signature);
  } catch (error) {
    logger.error('Failed to generate upload signature', { error });
    res.status(500).json({ message: 'Failed to generate upload signature' });
  }
});

/**
 * DELETE /api/upload/:publicId
 * Delete an image by public ID
 */
router.delete('/:publicId', async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    const success = await deleteImage(publicId);

    if (success) {
      res.json({ success: true, message: 'Image deleted' });
    } else {
      res.status(500).json({ message: 'Failed to delete image' });
    }
  } catch (error) {
    logger.error('Delete failed', { error });
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

export default router;
