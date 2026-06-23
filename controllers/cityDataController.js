import CityData from '../models/CityData.js';

export const getCityData = async (req, res, next) => {
  try {
    const rawData = await CityData.find({});

    if (rawData.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const temps = rawData.map(d => d.temperature);
    const pops = rawData.map(d => d.populationDensity);
    const energies = rawData.map(d => d.energyConsumption);
    const aqis = rawData.map(d => d.aqi);

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

    const mappedData = rawData.map(d => {
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
      };
    });

    res.status(200).json({
      success: true,
      count: mappedData.length,
      data: mappedData
    });

  } catch (error) {
    next(error);
  }
};
