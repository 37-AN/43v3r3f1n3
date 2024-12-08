import { ArduinoPLCDataPoint, ProcessedArduinoData } from './arduino/types';
import { detectArduinoAnomalies } from './arduino/anomalyDetection';
import { reduceArduinoNoise } from './arduino/noiseReduction';
import { calculateProcessInsights } from './arduino/insights';

export const refineArduinoData = async (
  data: ArduinoPLCDataPoint[]
): Promise<ProcessedArduinoData> => {
  console.log("Starting enhanced Arduino PLC data refinement process");
  
  // Step 1: Sort and prepare data
  const sortedData = [...data].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Step 2: Apply advanced noise reduction
  const smoothedData = reduceArduinoNoise(sortedData);
  
  // Step 3: Detect anomalies with enhanced algorithm
  const anomalies = detectArduinoAnomalies(smoothedData);
  
  // Step 4: Calculate process insights
  const insights = calculateProcessInsights(smoothedData, anomalies);
  
  console.log("Data refinement completed", {
    originalCount: data.length,
    refinedCount: smoothedData.length,
    anomaliesFound: anomalies.length,
    insights
  });

  return {
    originalData: data,
    refinedData: smoothedData,
    anomalies,
    insights
  };
};

export type { ArduinoPLCDataPoint, ProcessedArduinoData };