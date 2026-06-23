import express from 'express';
import { getRankings } from '../controllers/predictionsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getRankings);

export default router;
