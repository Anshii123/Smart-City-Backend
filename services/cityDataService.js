import CityData from '../models/CityData.js';

let cachedCityDataMapped = null;
let cachedBounds = null;

export const loadCityDataCache = async () => {
  try {
    const rawCityData = await CityData.find({});
    if (rawCityData.length === 0) {
      cachedCityDataMapped = [];
      cachedBounds = null;
      console.log('[City Data Cache] Cache initialized. No city data records in DB.');
      return;
    }

    const temps = rawCityData.map(d => d.temperature);
    const pops = rawCityData.map(d => d.populationDensity);
    const energies = rawCityData.map(d => d.energyConsumption);
    const aqis = rawCityData.map(d => d.aqi);

    const bounds = {
      temp_min: Math.min(...temps),
      temp_max: Math.max(...temps),
      pop_min: Math.min(...pops),
      pop_max: Math.max(...pops),
      energy_min: Math.min(...energies),
      energy_max: Math.max(...energies),
      aqi_min: Math.min(...aqis),
      aqi_max: Math.max(...aqis),
    };

    const landCoverWeights = {
      'Industrial': 1.0,
      'Urban': 0.8,
      'Water': 0.1,
      'Green Space': 0.0
    };

    cachedCityDataMapped = rawCityData.map(d => {
      const tempRange = bounds.temp_max - bounds.temp_min || 1;
      const popRange = bounds.pop_max - bounds.pop_min || 1;
      const energyRange = bounds.energy_max - bounds.energy_min || 1;
      const aqiRange = bounds.aqi_max - bounds.aqi_min || 1;

      const norm_temp = (d.temperature - bounds.temp_min) / tempRange;
      const norm_pop = (d.populationDensity - bounds.pop_min) / popRange;
      const norm_energy = (d.energyConsumption - bounds.energy_min) / energyRange;
      const norm_aqi = (d.aqi - bounds.aqi_min) / aqiRange;
      const inv_green = 1.0 - (d.urbanGreennessRatio / 100.0);
      const lc_weight = landCoverWeights[d.landCover] !== undefined ? landCoverWeights[d.landCover] : 0.5;

      const heatRiskScore = (0.5 * norm_temp + 0.3 * lc_weight + 0.2 * norm_energy) * 100.0;
      const heatVulnerabilityScore = (0.4 * norm_pop + 0.3 * norm_aqi + 0.3 * inv_green) * 100.0;
      const plantationPriorityScore = (0.4 * inv_green + 0.2 * norm_temp + 0.2 * norm_pop + 0.2 * norm_aqi) * 100.0;

      return {
        id: d._id,
        cityName: d.cityName,
        latitude: d.latitude,
        longitude: d.longitude,
        elevation: d.elevation,
        temperature: d.temperature,
        landCover: d.landCover,
        populationDensity: d.populationDensity,
        energyConsumption: d.energyConsumption,
        aqi: d.aqi,
        urbanGreennessRatio: d.urbanGreennessRatio,
        heatRiskScore: parseFloat(heatRiskScore.toFixed(2)),
        heatVulnerabilityScore: parseFloat(heatVulnerabilityScore.toFixed(2)),
        plantationPriorityScore: parseFloat(plantationPriorityScore.toFixed(2)),
        isPrediction: false
      };
    });

    cachedBounds = bounds;
    console.log(`[City Data Cache] Cached ${cachedCityDataMapped.length} city data records and recalculated statistics.`);
  } catch (err) {
    console.error(`[City Data Cache] Error loading cache:`, err.message);
  }
};

export const getCachedCityDataMapped = async () => {
  if (cachedCityDataMapped === null) {
    await loadCityDataCache();
  }
  return cachedCityDataMapped;
};

export const getCachedBounds = async () => {
  if (cachedBounds === null) {
    await loadCityDataCache();
  }
  return cachedBounds;
};
