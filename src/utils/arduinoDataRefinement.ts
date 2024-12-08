import { toast } from "sonner";

export interface ArduinoPLCDataPoint {
  timestamp: string;
  value: number;
  data_type: string;
  device_id: string;
}

export interface ProcessedArduinoData {
  originalData: ArduinoPLCDataPoint[];
  refinedData: ArduinoPLCDataPoint[];
  anomalies: ArduinoPLCDataPoint[];
  insights: {
    efficiency: number;
    stability: number;
    recommendations: string[];
  };
}

// Enhanced anomaly detection with machine learning-inspired approach
export const detectArduinoAnomalies = (
  data: ArduinoPLCDataPoint[]
): ArduinoPLCDataPoint[] => {
  console.log("Detecting anomalies using advanced statistical methods:", data);
  
  if (data.length < 2) {
    console.log("Not enough data points for anomaly detection");
    return [];
  }

  try {
    // Calculate mean and standard deviation for each data type with exponential weighting
    const dataByType = data.reduce((acc, point) => {
      if (!acc[point.data_type]) {
        acc[point.data_type] = [];
      }
      acc[point.data_type].push(point.value);
      return acc;
    }, {} as Record<string, number[]>);

    const anomalies: ArduinoPLCDataPoint[] = [];

    Object.entries(dataByType).forEach(([dataType, values]) => {
      // Calculate exponentially weighted moving average (EWMA)
      const alpha = 0.15; // Smoothing factor
      let ewma = values[0];
      let ewmvar = 0;
      
      values.forEach((value, i) => {
        if (i > 0) {
          ewma = alpha * value + (1 - alpha) * ewma;
          ewmvar = alpha * Math.pow(value - ewma, 2) + (1 - alpha) * ewmvar;
        }
      });

      const stdDev = Math.sqrt(ewmvar);
      const threshold = 2.5 * stdDev;

      // Detect anomalies using dynamic thresholding
      data.forEach(point => {
        if (
          point.data_type === dataType &&
          Math.abs(point.value - ewma) > threshold
        ) {
          anomalies.push(point);
        }
      });
    });

    console.log("Detected anomalies:", anomalies);
    return anomalies;
  } catch (error) {
    console.error("Error in anomaly detection:", error);
    toast.error("Error detecting anomalies in Arduino data");
    return [];
  }
};

// Enhanced noise reduction using Kalman filter-inspired approach
export const reduceArduinoNoise = (
  data: ArduinoPLCDataPoint[],
  processNoise: number = 0.1,
  measurementNoise: number = 1
): ArduinoPLCDataPoint[] => {
  console.log("Reducing noise with advanced filtering, process noise:", processNoise);
  
  if (data.length < 2) {
    console.log("Not enough data points for noise reduction");
    return [...data];
  }

  const smoothedData = [...data];
  const dataByType = data.reduce((acc, point) => {
    const key = `${point.device_id}-${point.data_type}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(point);
    return acc;
  }, {} as Record<string, ArduinoPLCDataPoint[]>);

  Object.values(dataByType).forEach(typeData => {
    typeData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Initialize Kalman filter parameters
    let x = typeData[0].value; // State estimate
    let p = 1; // Estimate uncertainty
    
    typeData.forEach((point, i) => {
      // Predict
      const q = processNoise;
      p = p + q;
      
      // Update
      const k = p / (p + measurementNoise);
      x = x + k * (point.value - x);
      p = (1 - k) * p;
      
      const index = smoothedData.findIndex(d => 
        d.timestamp === point.timestamp &&
        d.device_id === point.device_id &&
        d.data_type === point.data_type
      );
      
      if (index !== -1) {
        smoothedData[index] = {
          ...smoothedData[index],
          value: Number(x.toFixed(2))
        };
      }
    });
  });

  console.log("Noise reduction completed with Kalman filtering");
  return smoothedData;
};

// Process and refine Arduino PLC data with enhanced analytics
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

// New function to calculate process insights
const calculateProcessInsights = (
  refinedData: ArduinoPLCDataPoint[],
  anomalies: ArduinoPLCDataPoint[]
) => {
  // Calculate process efficiency
  const efficiency = calculateEfficiency(refinedData);
  
  // Calculate process stability
  const stability = calculateStability(refinedData, anomalies);
  
  // Generate recommendations
  const recommendations = generateRecommendations(efficiency, stability, anomalies);
  
  return {
    efficiency,
    stability,
    recommendations
  };
};

const calculateEfficiency = (data: ArduinoPLCDataPoint[]): number => {
  if (data.length === 0) return 0;
  
  const recentData = data.slice(-10); // Look at last 10 points
  const avgValue = recentData.reduce((sum, point) => sum + point.value, 0) / recentData.length;
  
  // Normalize to percentage (assuming optimal value range is 0-100)
  return Math.min(Math.max((avgValue / 100) * 100, 0), 100);
};

const calculateStability = (
  data: ArduinoPLCDataPoint[],
  anomalies: ArduinoPLCDataPoint[]
): number => {
  if (data.length === 0) return 0;
  
  // Calculate stability based on anomaly frequency and variance
  const anomalyRatio = 1 - (anomalies.length / data.length);
  const values = data.map(point => point.value);
  const variance = calculateVariance(values);
  const normalizedVariance = Math.min(1, 1 / (1 + variance));
  
  return (anomalyRatio * 0.6 + normalizedVariance * 0.4) * 100;
};

const calculateVariance = (values: number[]): number => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
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