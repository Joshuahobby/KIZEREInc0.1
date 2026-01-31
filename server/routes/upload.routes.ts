import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadImage, uploadImages, getUploadSignature, deleteImage } from '../services/cloudinary.service';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('UploadRoutes');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * POST /api/upload
 * Upload a single image
 */
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
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
    res.status(500).json({ message: 'Failed to upload images' });
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
