import express from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import uploadRoutes from './upload.js';
import climateRoutes from './climate.js';
import predictRoutes from './predict.js';
import cityDataRoutes from './cityData.js';
import predictionsRoutes from './predictions.js';
import rankingsRoutes from './rankings.js';
import heatmapRoutes from './heatmap.js';
import analyticsRoutes from './analytics.js';

const router = express.Router();

// Mount api routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/uploads', uploadRoutes);
router.use('/climate', climateRoutes);
router.use('/predict', predictRoutes);
router.use('/city-data', cityDataRoutes);
router.use('/predictions', predictionsRoutes);
router.use('/rankings', rankingsRoutes);
router.use('/heatmap', heatmapRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
