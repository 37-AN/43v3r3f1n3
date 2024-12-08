import { ChartData } from "@/types/simulation";

export function useSimulationTransform(chartData: ChartData) {
  // Transform chartData into the format expected by DataAnalyzer
  const transformedData = Object.entries(chartData).reduce((acc, [key, dataPoints]) => {
    // Use the most recent value for each metric
    const latestDataPoint = dataPoints[dataPoints.length - 1];
    acc[key] = latestDataPoint?.value || 0;
    return acc;
  }, {} as Record<string, number>);

  return transformedData;
}