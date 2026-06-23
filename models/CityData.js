import mongoose from 'mongoose';

const CityDataSchema = new mongoose.Schema({
  cityName: {
    type: String,
    required: [true, 'City Name is required'],
    trim: true,
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required'],
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
  },
  elevation: {
    type: Number,
    required: [true, 'Elevation is required'],
  },
  temperature: {
    type: Number,
    required: [true, 'Temperature is required'],
  },
  landCover: {
    type: String,
    required: [true, 'Land Cover is required'],
    trim: true,
  },
  populationDensity: {
    type: Number,
    required: [true, 'Population Density is required'],
  },
  energyConsumption: {
    type: Number,
    required: [true, 'Energy Consumption is required'],
  },
  aqi: {
    type: Number,
    required: [true, 'AQI is required'],
  },
  urbanGreennessRatio: {
    type: Number,
    required: [true, 'Urban Greenness Ratio is required'],
  },
  uploadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CityData = mongoose.model('CityData', CityDataSchema);

export default CityData;
