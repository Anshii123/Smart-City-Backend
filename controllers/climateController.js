import { getPredictions } from '../services/mlService.js';
import { generateRecommendations } from '../services/recommendationService.js';

// @desc    Analyze climate metrics and generate recommendations
// @route   POST /api/climate/analyze
// @access  Private
export const analyzeClimate = async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      elevation,
      temperature,
      landCover,
      populationDensity,
      energyConsumption,
      aqi,
      urbanGreennessRatio
    } = req.body;

    if (
      latitude === undefined ||
      longitude === undefined ||
      elevation === undefined ||
      temperature === undefined ||
      !landCover ||
      populationDensity === undefined ||
      energyConsumption === undefined ||
      aqi === undefined ||
      urbanGreennessRatio === undefined
    ) {
      const error = new Error('Please provide all required parameters');
      error.statusCode = 400;
      return next(error);
    }

    const validLandCovers = ['Water', 'Green Space', 'Industrial', 'Urban'];
    if (!validLandCovers.includes(landCover)) {
      const error = new Error(`Invalid landCover. Must be one of: ${validLandCovers.join(', ')}`);
      error.statusCode = 400;
      return next(error);
    }

    const inputs = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      elevation: parseFloat(elevation),
      temperature: parseFloat(temperature),
      landCover,
      populationDensity: parseFloat(populationDensity),
      energyConsumption: parseFloat(energyConsumption),
      aqi: parseFloat(aqi),
      urbanGreennessRatio: parseFloat(urbanGreennessRatio)
    };

    const startTime = Date.now();
    const mlPredictions = await getPredictions(inputs);
    const duration = Date.now() - startTime;
    console.log(`Prediction completed in ${duration} ms`);

    const recommendations = generateRecommendations(inputs, mlPredictions);

    res.status(200).json({
      success: true,
      inputs,
      predictions: {
        heatRiskScore: mlPredictions['Heat Risk Score'],
        heatVulnerabilityScore: mlPredictions['Heat Vulnerability Score'],
        plantationPriorityScore: mlPredictions['Plantation Priority Score']
      },
      recommendations
    });

  } catch (error) {
    next(error);
  }
};
