import mongoose from 'mongoose';

const PredictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cityName: {
    type: String,
    required: true,
    trim: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  elevation: {
    type: Number,
    required: true,
  },
  temperature: {
    type: Number,
    required: true,
  },
  landCover: {
    type: String,
    required: true,
  },
  populationDensity: {
    type: Number,
    required: true,
  },
  energyConsumption: {
    type: Number,
    required: true,
  },
  aqi: {
    type: Number,
    required: true,
  },
  urbanGreennessRatio: {
    type: Number,
    required: true,
  },
  heatRiskScore: {
    type: Number,
    required: true,
  },
  heatVulnerabilityScore: {
    type: Number,
    required: true,
  },
  plantationPriorityScore: {
    type: Number,
    required: true,
  },
  futureTemperature: {
    type: Number,
    required: true,
  },
  riskCategory: {
    type: String,
    required: true,
  },
  plantationPriorityLevel: {
    type: String,
    required: true,
  },
  plantationRanking: {
    type: Number,
    required: true,
  },
  greenCoverTarget: {
    type: Number,
    required: true,
  },
  temperatureReductionEstimate: {
    type: Number,
    required: true,
  },
  climateRecommendations: {
    type: [String],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Prediction = mongoose.model('Prediction', PredictionSchema);

export default Prediction;
