import express from 'express';
import { uploadDataset, getUploadHistory } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('file'), uploadDataset);
router.get('/', protect, getUploadHistory);

export default router;
