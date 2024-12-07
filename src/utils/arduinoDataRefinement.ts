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
}

// Detect anomalies using statistical approach
export const detectArduinoAnomalies = (
  data: ArduinoPLCDataPoint[]
): ArduinoPLCDataPoint[] => {
  console.log("Detecting anomalies in Arduino PLC data:", data);
  
  if (data.length < 2) {
    console.log("Not enough data points for anomaly detection");
    return [];
  }

  try {
    // Calculate mean and standard deviation for each data type
    const dataByType = data.reduce((acc, point) => {
      if (!acc[point.data_type]) {
        acc[point.data_type] = [];
      }
      acc[point.data_type].push(point.value);
      return acc;
    }, {} as Record<string, number[]>);

    const anomalies: ArduinoPLCDataPoint[] = [];

    Object.entries(dataByType).forEach(([dataType, values]) => {
      const mean = values.reduce((a, b) => a + b) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
      );

      // Find points that are more than 2 standard deviations from the mean
      data.forEach(point => {
        if (
          point.data_type === dataType &&
          Math.abs(point.value - mean) > 2 * stdDev
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

// Reduce noise using moving average
export const reduceArduinoNoise = (
  data: ArduinoPLCDataPoint[],
  windowSize: number = 3
): ArduinoPLCDataPoint[] => {
  console.log("Reducing noise in Arduino PLC data with window size:", windowSize);
  
  if (data.length < windowSize) {
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
    
    for (let i = windowSize; i < typeData.length - windowSize; i++) {
      const window = typeData
        .slice(i - windowSize, i + windowSize + 1)
        .map(point => point.value);
      
      const average = window.reduce((sum, value) => sum + value, 0) / (2 * windowSize + 1);
      
      const index = smoothedData.findIndex(point => 
        point.timestamp === typeData[i].timestamp &&
        point.device_id === typeData[i].device_id &&
        point.data_type === typeData[i].data_type
      );
      
      if (index !== -1) {
        smoothedData[index] = {
          ...smoothedData[index],
          value: Number(average.toFixed(2))
        };
      }
    }
  });

  console.log("Noise reduction completed");
  return smoothedData;
};

// Process and refine Arduino PLC data
export const refineArduinoData = async (
  data: ArduinoPLCDataPoint[]
): Promise<ProcessedArduinoData> => {
  console.log("Starting Arduino PLC data refinement process");
  
  // Step 1: Sort data by timestamp
  const sortedData = [...data].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Step 2: Reduce noise
  const smoothedData = reduceArduinoNoise(sortedData);
  
  // Step 3: Detect anomalies
  const anomalies = detectArduinoAnomalies(smoothedData);
  
  console.log("Data refinement completed", {
    originalCount: data.length,
    refinedCount: smoothedData.length,
    anomaliesFound: anomalies.length,
  });

  return {
    originalData: data,
    refinedData: smoothedData,
    anomalies,
  };
};