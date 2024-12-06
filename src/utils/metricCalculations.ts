import { SimulationParameters, isValidSimulationParameters } from "@/types/simulation";
import { DeviceMetric } from "@/types/device";

export function generateMetricValue(currentValue: number, parameters: SimulationParameters | null): number {
  if (!parameters) {
    // Fallback behavior when parameters are invalid
    return currentValue + (Math.random() - 0.5) * 5;
  }
  
  // Use simulation parameters to influence the generated values
  const baseVariation = (Math.random() - 0.5) * 10;
  const parameterInfluence = parameters.registers.length || 1;
  return currentValue + (baseVariation * parameterInfluence);
}

export function updateDeviceMetrics(
  metrics: DeviceMetric[],
  parameters: unknown
): DeviceMetric[] {
  const validParameters = parameters && isValidSimulationParameters(parameters) ? parameters : null;
  
  return metrics.map(metric => ({
    ...metric,
    value: typeof metric.value === 'number' 
      ? generateMetricValue(metric.value, validParameters)
      : metric.value
  }));
}