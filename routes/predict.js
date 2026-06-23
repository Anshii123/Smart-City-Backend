import express from 'express';
import { predictClimate } from '../controllers/predictController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, predictClimate);

export default router;
