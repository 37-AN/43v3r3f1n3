import { SimulationParameters, isValidSimulationParameters } from "@/types/simulation";
import { DeviceMetric } from "@/types/device";

function generateSensorValue(min: number, max: number, currentValue: number): number {
  // Add some random variation while staying within bounds
  const variation = (Math.random() - 0.5) * (max - min) * 0.1;
  const newValue = currentValue + variation;
  return Math.min(Math.max(newValue, min), max);
}

export function generateMetricValue(currentValue: number, parameters: SimulationParameters | null): number {
  if (!parameters) {
    // Default behavior for devices without specific parameters
    return currentValue + (Math.random() - 0.5) * 5;
  }
  
  // Use simulation parameters to generate more realistic values
  const register = parameters.registers[0];
  if (!register) return currentValue;

  // Generate values based on register type and range
  const minValue = 0;
  const maxValue = register.value * 2; // Use register value as a reference point
  
  return generateSensorValue(minValue, maxValue, currentValue);
}

export function updateDeviceMetrics(
  metrics: DeviceMetric[],
  parameters: unknown
): DeviceMetric[] {
  const validParameters = parameters && isValidSimulationParameters(parameters) ? parameters : null;
  
  return metrics.map(metric => {
    if (typeof metric.value === 'number') {
      // Apply different update logic based on metric type
      switch (metric.label.toLowerCase()) {
        case 'cpu load':
          return {
            ...metric,
            value: generateSensorValue(0, 100, metric.value)
          };
        case 'memory usage':
          return {
            ...metric,
            value: generateSensorValue(0, 8, metric.value)
          };
        case 'network i/o':
          return {
            ...metric,
            value: generateSensorValue(0, 10, parseFloat(metric.value.toString())).toFixed(1)
          };
        default:
          return {
            ...metric,
            value: generateMetricValue(metric.value, validParameters)
          };
      }
    }
    return metric;
  });
}