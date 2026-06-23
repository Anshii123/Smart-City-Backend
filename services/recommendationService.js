export const generateRecommendations = (inputs, mlPredictions) => {
  const {
    temperature,
    landCover,
    populationDensity,
    aqi,
    urbanGreennessRatio
  } = inputs;

  const {
    'Heat Risk Score': heatRiskScore,
    'Heat Vulnerability Score': heatVulnerabilityScore,
    'Plantation Priority Score': plantationPriorityScore
  } = mlPredictions;

  // 1. Risk Category
  let riskCategory = 'Low';
  if (heatRiskScore >= 85) {
    riskCategory = 'Extreme';
  } else if (heatRiskScore >= 60) {
    riskCategory = 'High';
  } else if (heatRiskScore >= 30) {
    riskCategory = 'Moderate';
  }

  // 2. Plantation Priority Level
  let plantationPriorityLevel = 'Low';
  if (plantationPriorityScore >= 80) {
    plantationPriorityLevel = 'Critical';
  } else if (plantationPriorityScore >= 55) {
    plantationPriorityLevel = 'High';
  } else if (plantationPriorityScore >= 30) {
    plantationPriorityLevel = 'Medium';
  }

  // 3. Plantation Ranking (1 to 10, where 10 is highest urgency)
  const plantationRanking = Math.max(1, Math.min(10, Math.round(plantationPriorityScore / 10)));

  // 4. Green Cover Target (%)
  let baseTarget = 30;
  if (populationDensity > 5000) {
    baseTarget = 40;
  } else if (populationDensity > 2000) {
    baseTarget = 35;
  }
  const greenCoverTarget = Math.min(80, Math.max(baseTarget, urbanGreennessRatio + 10));

  // 5. Temperature Reduction Estimate (°C)
  const tempReductionEstimate = Math.max(0, (greenCoverTarget - urbanGreennessRatio) * 0.12);

  // Future Temperature Projection (°C)
  const futureTemperature = temperature + (heatRiskScore * 0.04) + (aqi * 0.01) - (urbanGreennessRatio * 0.02);

  // 6. Climate Recommendations (Rule-based list)
  const climateRecommendations = [];

  if (aqi > 150) {
    climateRecommendations.push(
      "Install thick green buffer zones near high-traffic corridors and industrial borders to capture particulate matter (PM2.5/PM10)."
    );
  }

  if (urbanGreennessRatio < 20) {
    climateRecommendations.push(
      "Initiate micro-forest (Miyawaki method) projects and street-level canopy planting to establish contiguous urban cooling corridors."
    );
  }

  if (landCover.toLowerCase() === 'industrial') {
    climateRecommendations.push(
      "Mandate cool reflective roofing, industrial green walls, and permeable parking lot surfaces to mitigate waste heat in commercial zones."
    );
  }

  if (populationDensity > 7000) {
    climateRecommendations.push(
      "Establish pocket parks, green rooftops, and vertical gardens to maximize vegetation in high-density urban areas with space constraints."
    );
  }

  if (heatRiskScore > 70) {
    climateRecommendations.push(
      "Establish public cooling shelters, shaded walkways, and deploy public misting systems during high-temperature alerts."
    );
  }

  if (plantationPriorityScore > 70) {
    climateRecommendations.push(
      "Prioritize public budget allocation for tree plantation drives and community-led urban forestry programs."
    );
  }

  if (temperature > 30) {
    climateRecommendations.push(
      "Implement municipal heat emergency response protocols and expand irrigation schedules for key urban green zones."
    );
  }

  if (climateRecommendations.length === 0) {
    climateRecommendations.push(
      "Maintain and monitor existing urban green covers while promoting local community garden programs."
    );
  }

  return {
    riskCategory,
    futureTemperature: parseFloat(futureTemperature.toFixed(2)),
    plantationPriorityLevel,
    plantationRanking,
    greenCoverTarget: parseFloat(greenCoverTarget.toFixed(2)),
    temperatureReductionEstimate: parseFloat(tempReductionEstimate.toFixed(2)),
    climateRecommendations
  };
};
