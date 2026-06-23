import express from 'express';
import { getCityData } from '../controllers/cityDataController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getCityData);

export default router;
