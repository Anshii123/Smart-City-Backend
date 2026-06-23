import express from 'express';
import { getHeatmap } from '../controllers/predictionsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getHeatmap);

export default router;
