import { pipeline } from "@huggingface/transformers";
import { toast } from "sonner";

let featureExtractor: any = null;
let anomalyDetector: any = null;

interface ProcessedData {
  cleanedData: number[];
  anomalies: number[];
  predictions: {
    value: number;
    confidence: number;
  }[];
}

export const initializeAIPipelines = async () => {
  try {
    console.log("Initializing AI pipelines...");
    
    featureExtractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      { revision: "main" }
    );

    anomalyDetector = await pipeline(
      "text-classification",
      "Xenova/industrial-anomaly-detection",
      { revision: "main" }
    );

    console.log("AI pipelines initialized successfully");
  } catch (error) {
    console.error("Error initializing AI pipelines:", error);
    throw error;
  }
};

export const processIndustrialData = async (
  rawData: number[],
  metadata: Record<string, any>
): Promise<ProcessedData> => {
  console.log("Processing industrial data:", { rawData, metadata });

  if (!featureExtractor || !anomalyDetector) {
    await initializeAIPipelines();
  }

  // Convert numerical data to text format for feature extraction
  const textData = rawData.map(value => value.toString());
  
  // Extract features
  const features = await featureExtractor(textData, {
    pooling: "mean",
    normalize: true
  });

  // Detect anomalies
  const anomalyScores = await Promise.all(
    textData.map(async (value) => {
      const result = await anomalyDetector(value);
      return result[0].score;
    })
  );

  const anomalies = rawData.filter((_, index) => anomalyScores[index] > 0.7);

  // Clean and normalize data
  const cleanedData = rawData.map((value, index) => {
    if (anomalyScores[index] > 0.7) {
      // Replace anomalies with moving average
      const start = Math.max(0, index - 2);
      const end = Math.min(rawData.length, index + 3);
      const window = rawData.slice(start, end);
      return window.reduce((a, b) => a + b, 0) / window.length;
    }
    return value;
  });

  // Generate predictions using feature patterns
  const predictions = await generatePredictions(features, cleanedData);

  console.log("Data processing completed", {
    cleanedCount: cleanedData.length,
    anomalyCount: anomalies.length,
    predictions: predictions.length
  });

  return {
    cleanedData,
    anomalies,
    predictions
  };
};

const generatePredictions = async (
  features: any,
  historicalData: number[]
): Promise<{ value: number; confidence: number }[]> => {
  // Simple prediction using moving average and feature weights
  const predictions = [];
  const windowSize = 5;

  for (let i = windowSize; i < historicalData.length; i++) {
    const window = historicalData.slice(i - windowSize, i);
    const avg = window.reduce((a, b) => a + b) / windowSize;
    const featureWeight = features[i] ? features[i][0] : 1;
    
    predictions.push({
      value: avg * featureWeight,
      confidence: Math.min(Math.abs(featureWeight), 1)
    });
  }

  return predictions;
};