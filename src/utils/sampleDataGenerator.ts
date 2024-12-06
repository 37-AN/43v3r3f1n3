import { TimeSeriesDataPoint } from "@/utils/dataRefinement";

export const generateSampleData = (length: number, baseValue: number, variance: number): TimeSeriesDataPoint[] => {
  return Array.from({ length }, (_, i) => ({
    timestamp: `${i}:00`,
    value: baseValue + Math.sin(i / 4) * variance + (Math.random() - 0.5) * variance,
  }));
};

export const performanceData = generateSampleData(24, 75, 15);
export const resourceData = generateSampleData(24, 50, 20);