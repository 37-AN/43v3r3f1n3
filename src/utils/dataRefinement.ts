import { pipeline } from "@huggingface/transformers";
import { toast } from "sonner";

// Types for our data processing
export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

export interface ProcessedData {
  originalData: TimeSeriesDataPoint[];
  refinedData: TimeSeriesDataPoint[];
  anomalies: TimeSeriesDataPoint[];
}

// Initialize the AI pipeline for anomaly detection
let anomalyDetector: any = null;

export const initializeAIModels = async () => {
  try {
    console.log("Initializing AI models...");
    anomalyDetector = await pipeline(
      "time-series-prediction",
      "julien-c/ts-anomaly-detection",
      { device: "cpu" }
    );
    console.log("AI models initialized successfully");
    toast.success("AI models loaded successfully");
  } catch (error) {
    console.error("Error initializing AI models:", error);
    toast.error("Failed to load AI models");
  }
};

// Detect anomalies in time series data
export const detectAnomalies = async (
  data: TimeSeriesDataPoint[]
): Promise<TimeSeriesDataPoint[]> => {
  if (!anomalyDetector) {
    console.warn("AI models not initialized. Initializing now...");
    await initializeAIModels();
  }

  try {
    console.log("Processing data for anomaly detection:", data);
    const values = data.map((point) => point.value);
    const predictions = await anomalyDetector(values, {
      threshold: 0.95,
    });

    return data.filter((point, index) => predictions[index].isAnomaly);
  } catch (error) {
    console.error("Error in anomaly detection:", error);
    toast.error("Error detecting anomalies");
    return [];
  }
};

// Predict missing values using interpolation and AI
export const predictMissingValues = (
  data: TimeSeriesDataPoint[]
): TimeSeriesDataPoint[] => {
  console.log("Predicting missing values for data:", data);
  const refinedData = [...data];

  for (let i = 1; i < refinedData.length - 1; i++) {
    if (isNaN(refinedData[i].value)) {
      // Simple linear interpolation for missing values
      const prevValue = refinedData[i - 1].value;
      const nextValue = refinedData[i + 1].value;
      refinedData[i].value = (prevValue + nextValue) / 2;
      console.log(`Predicted missing value at index ${i}:`, refinedData[i].value);
    }
  }

  return refinedData;
};

// Reduce noise using moving average
export const reduceNoise = (
  data: TimeSeriesDataPoint[],
  windowSize: number = 3
): TimeSeriesDataPoint[] => {
  console.log("Reducing noise in data with window size:", windowSize);
  const smoothedData = [...data];

  for (let i = windowSize; i < data.length - windowSize; i++) {
    const window = data
      .slice(i - windowSize, i + windowSize + 1)
      .map((point) => point.value);
    const average =
      window.reduce((sum, value) => sum + value, 0) / (2 * windowSize + 1);
    smoothedData[i] = {
      ...data[i],
      value: Number(average.toFixed(2)),
    };
  }

  return smoothedData;
};

// Main function to process and refine data
export const refineData = async (
  data: TimeSeriesDataPoint[]
): Promise<ProcessedData> => {
  console.log("Starting data refinement process");
  
  // Step 1: Predict missing values
  const dataWithPredictions = predictMissingValues(data);
  
  // Step 2: Reduce noise
  const smoothedData = reduceNoise(dataWithPredictions);
  
  // Step 3: Detect anomalies
  const anomalies = await detectAnomalies(smoothedData);
  
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