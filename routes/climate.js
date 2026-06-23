import express from 'express';
import { analyzeClimate } from '../controllers/climateController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/analyze', protect, analyzeClimate);

export default router;
