import { SimulationParameters, isValidSimulationParameters } from "@/types/simulation";
import { DeviceMetric } from "@/types/device";

function generateSensorValue(min: number, max: number, currentValue: number): number {
  // Add some random variation while staying within bounds
  const variation = (Math.random() - 0.5) * (max - min) * 0.1;
  const newValue = currentValue + variation;
  return Math.min(Math.max(newValue, min), max);
}

export function generateMetricValue(
  metricKey: string,
  currentValue: number,
  parameters: SimulationParameters | null
): number {
  if (!parameters) {
    // Default behavior for devices without specific parameters
    return currentValue + (Math.random() - 0.5) * 5;
  }
  
  // Get the parameter range for this metric
  const paramKey = metricKey.toLowerCase().replace(/\s+/g, '_') as keyof SimulationParameters;
  const range = parameters[paramKey];
  
  if (!range) {
    return currentValue + (Math.random() - 0.5) * 5;
  }
  
  return generateSensorValue(range.min, range.max, currentValue);
}

export function updateDeviceMetrics(
  metrics: DeviceMetric[],
  parameters: unknown
): DeviceMetric[] {
  const validParameters = parameters && isValidSimulationParameters(parameters) ? parameters : null;
  
  return metrics.map(metric => {
    if (typeof metric.value === 'number') {
      return {
        ...metric,
        value: generateMetricValue(metric.label, metric.value, validParameters)
      };
    }
    return metric;
  });
}