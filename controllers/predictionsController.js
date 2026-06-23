import Prediction from '../models/Prediction.js';
import CityData from '../models/CityData.js';
import { getCachedCityDataMapped } from '../services/cityDataService.js';

// @desc    Get predictions for the logged-in user
// @route   GET /api/predictions
// @access  Private
export const getPredictions = async (req, res, next) => {
  try {
    const predictions = await Prediction.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: predictions.length,
      data: predictions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save a prediction explicitly (used for client-side fallback saves)
// @route   POST /api/predictions
// @access  Private
export const savePrediction = async (req, res, next) => {
  try {
    const {
      cityName, latitude, longitude, elevation, temperature, landCover,
      populationDensity, energyConsumption, aqi, urbanGreennessRatio,
      heatRiskScore, heatVulnerabilityScore, plantationPriorityScore,
      futureTemperature, riskCategory, plantationPriorityLevel,
      plantationRanking, greenCoverTarget, temperatureReductionEstimate,
      climateRecommendations
    } = req.body;

    const required = { cityName, heatRiskScore, heatVulnerabilityScore, plantationPriorityScore, riskCategory };
    for (const [key, val] of Object.entries(required)) {
      if (val === undefined || val === null) {
        const error = new Error(`Missing required field: ${key}`);
        error.statusCode = 400;
        return next(error);
      }
    }

    const predictionDoc = await Prediction.create({
      userId: req.user._id,
      cityName: cityName || 'Custom City',
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      elevation: parseFloat(elevation) || 0,
      temperature: parseFloat(temperature) || 0,
      landCover: landCover || 'Urban',
      populationDensity: parseFloat(populationDensity) || 0,
      energyConsumption: parseFloat(energyConsumption) || 0,
      aqi: parseFloat(aqi) || 0,
      urbanGreennessRatio: parseFloat(urbanGreennessRatio) || 0,
      heatRiskScore: parseFloat(heatRiskScore),
      heatVulnerabilityScore: parseFloat(heatVulnerabilityScore),
      plantationPriorityScore: parseFloat(plantationPriorityScore),
      futureTemperature: parseFloat(futureTemperature) || parseFloat(temperature) || 0,
      riskCategory: riskCategory || 'Low',
      plantationPriorityLevel: plantationPriorityLevel || 'Low',
      plantationRanking: parseInt(plantationRanking) || 1,
      greenCoverTarget: parseFloat(greenCoverTarget) || 30,
      temperatureReductionEstimate: parseFloat(temperatureReductionEstimate) || 0,
      climateRecommendations: Array.isArray(climateRecommendations) ? climateRecommendations : []
    });

    res.status(201).json({
      success: true,
      data: predictionDoc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prediction by ID
// @route   GET /api/predictions/:id
// @access  Private
export const getPredictionById = async (req, res, next) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      const error = new Error('Prediction not found');
      error.statusCode = 404;
      return next(error);
    }
    res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete prediction
// @route   DELETE /api/predictions/:id
// @access  Private
export const deletePrediction = async (req, res, next) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      const error = new Error('Prediction not found');
      error.statusCode = 404;
      return next(error);
    }

    await prediction.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Prediction deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get rankings (Top 10 sorted by Plantation Priority Score descending)
// @route   GET /api/rankings
// @access  Private
export const getRankings = async (req, res, next) => {
  try {
    const rankings = await Prediction.find({})
      .sort({ plantationPriorityScore: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: rankings.length,
      data: rankings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get heatmap (predictions as flat mapping markers)
// @route   GET /api/heatmap
// @access  Private
export const getHeatmap = async (req, res, next) => {
  try {
    const predictions = await Prediction.find({});
    
    // Flat mapping so they match UI city node layout
    const mapped = predictions.map(p => ({
      id: p._id,
      cityName: p.cityName,
      latitude: p.latitude,
      longitude: p.longitude,
      elevation: p.elevation,
      temperature: p.temperature,
      landCover: p.landCover,
      populationDensity: p.populationDensity,
      energyConsumption: p.energyConsumption,
      aqi: p.aqi,
      urbanGreennessRatio: p.urbanGreennessRatio,
      heatRiskScore: p.heatRiskScore,
      heatVulnerabilityScore: p.heatVulnerabilityScore,
      plantationPriorityScore: p.plantationPriorityScore,
      riskCategory: p.riskCategory,
      plantationPriorityLevel: p.plantationPriorityLevel,
      plantationRanking: p.plantationRanking,
      greenCoverTarget: p.greenCoverTarget,
      temperatureReductionEstimate: p.temperatureReductionEstimate,
      climateRecommendations: p.climateRecommendations
    }));

    res.status(200).json({
      success: true,
      count: mapped.length,
      data: mapped
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get combined analytics (CSV uploads + Prediction History records)
// @route   GET /api/analytics
// @access  Private
export const getAnalytics = async (req, res, next) => {
  try {
    // 1. Fetch CSV uploaded city data from cache
    const csvDataMapped = await getCachedCityDataMapped();

    // 2. Fetch saved Prediction records
    const predictions = await Prediction.find({});
    const predictionsMapped = predictions.map(p => ({
      id: p._id,
      cityName: p.cityName,
      latitude: p.latitude,
      longitude: p.longitude,
      elevation: p.elevation,
      temperature: p.temperature,
      landCover: p.landCover,
      populationDensity: p.populationDensity,
      energyConsumption: p.energyConsumption,
      aqi: p.aqi,
      urbanGreennessRatio: p.urbanGreennessRatio,
      heatRiskScore: p.heatRiskScore,
      heatVulnerabilityScore: p.heatVulnerabilityScore,
      plantationPriorityScore: p.plantationPriorityScore,
      isPrediction: true
    }));

    // 3. Combine both collections
    const combinedData = [...csvDataMapped, ...predictionsMapped];

    res.status(200).json({
      success: true,
      count: combinedData.length,
      data: combinedData
    });
  } catch (error) {
    next(error);
  }
};
