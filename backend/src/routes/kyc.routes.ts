// backend/src/routes/kyc.routes.ts
import express from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import auth from '../middleware/auth.middleware';
import { KycController } from '../controllers/kyc.controller';

const router = express.Router();

// Rate limiting for KYC submission
const kycSubmitLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 submissions per 15 minutes (increased from 3)
  message: {
    error: 'Too many KYC submissions',
    message: 'Bạn đã gửi quá nhiều yêu cầu KYC. Vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Multer configuration for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file (increased for images/videos)
    files: 3, // Max 3 files
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 File upload:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      sizeInMB: file.size ? (file.size / (1024 * 1024)).toFixed(2) + 'MB' : 'unknown'
    });
    
    // Accept image, video, and application/octet-stream (Flutter fallback)
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      console.log('❌ File rejected:', file.mimetype);
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

// Submit KYC request
router.post('/submit',
  auth.authenticateToken,
  kycSubmitLimit,
  upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 }
  ]),
  KycController.uploadErrorHandler,
  KycController.submit
);

// Get KYC status for current user
router.get('/status', auth.authenticateToken, KycController.status);

// Get all KYC requests (Admin only)
router.get('/all', auth.authenticateToken, KycController.all);

// Get KYC request by ID (Admin only)
router.get('/:id', auth.authenticateToken, KycController.getById);

// Update KYC request status (Admin only)
router.put('/:id/status', auth.authenticateToken, KycController.updateStatus);

// Bulk update KYC request statuses (Admin only)
router.put('/bulk-update', auth.authenticateToken, KycController.bulkUpdate);

// Get KYC statistics (Admin only)
router.get('/stats/overview', auth.authenticateToken, KycController.stats);

// Check duplicate ID number
router.post('/check-duplicate', auth.authenticateToken, KycController.checkDuplicate);

export default router;
