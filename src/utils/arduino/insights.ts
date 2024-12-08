import { ArduinoPLCDataPoint } from './types';

const calculateEfficiency = (data: ArduinoPLCDataPoint[]): number => {
  if (data.length === 0) return 0;
  
  const recentData = data.slice(-10);
  const avgValue = recentData.reduce((sum, point) => sum + point.value, 0) / recentData.length;
  
  return Math.min(Math.max((avgValue / 100) * 100, 0), 100);
};

const calculateVariance = (values: number[]): number => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
};

const calculateStability = (
  data: ArduinoPLCDataPoint[],
  anomalies: ArduinoPLCDataPoint[]
): number => {
  if (data.length === 0) return 0;
  
  const anomalyRatio = 1 - (anomalies.length / data.length);
  const values = data.map(point => point.value);
  const variance = calculateVariance(values);
  const normalizedVariance = Math.min(1, 1 / (1 + variance));
  
  return (anomalyRatio * 0.6 + normalizedVariance * 0.4) * 100;
};

const generateRecommendations = (
  efficiency: number,
  stability: number,
  anomalies: ArduinoPLCDataPoint[]
): string[] => {
  const recommendations: string[] = [];
  
  if (efficiency < 70) {
    recommendations.push("Process efficiency is below target. Consider reviewing equipment calibration and maintenance schedules.");
  }
  
  if (stability < 80) {
    recommendations.push("Process stability needs improvement. Implement tighter control parameters and monitor environmental factors.");
  }
  
  if (anomalies.length > 0) {
    const recentAnomalies = anomalies.slice(-3);
    recommendations.push(`Detected ${anomalies.length} anomalies. Latest anomalies occurred in ${recentAnomalies.map(a => new Date(a.timestamp).toLocaleTimeString()).join(', ')}`);
  }
  
  return recommendations;
};

export const calculateProcessInsights = (
  refinedData: ArduinoPLCDataPoint[],
  anomalies: ArduinoPLCDataPoint[]
) => {
  const efficiency = calculateEfficiency(refinedData);
  const stability = calculateStability(refinedData, anomalies);
  const recommendations = generateRecommendations(efficiency, stability, anomalies);
  
  return {
    efficiency,
    stability,
    recommendations
  };
};