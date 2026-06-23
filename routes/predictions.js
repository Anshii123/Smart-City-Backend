import express from 'express';
import { getPredictions, getPredictionById, deletePrediction, savePrediction } from '../controllers/predictionsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getPredictions);
router.post('/', protect, savePrediction);
router.get('/:id', protect, getPredictionById);
router.delete('/:id', protect, deletePrediction);

export default router;
