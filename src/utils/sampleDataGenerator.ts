import { ModbusRegisterData } from "@/types/modbus";

const generateSineWaveValue = (
  baseValue: number, 
  amplitude: number, 
  frequency: number, 
  phase: number
): number => {
  const time = Date.now() / 1000; // Convert to seconds
  const noise = (Math.random() - 0.5) * 2; // Small random noise
  const sineComponent = Math.sin(frequency * time + phase) * amplitude;
  return Number((baseValue + sineComponent + noise).toFixed(2));
};

// Generate performance data with sine wave pattern
export const generatePerformanceData = (): ModbusRegisterData[] => {
  const basePerformance = 85; // Target performance around 85%
  return Array.from({ length: 24 }, (_, i) => {
    const timestamp = new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString();
    return {
      timestamp,
      value: generateSineWaveValue(basePerformance, 5, 0.5, i * 0.2),
      registerType: 'holding',
      address: 1
    };
  });
};

// Generate resource utilization data with different sine wave pattern
export const generateResourceData = (): ModbusRegisterData[] => {
  const baseUtilization = 65; // Target utilization around 65%
  return Array.from({ length: 24 }, (_, i) => {
    const timestamp = new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString();
    return {
      timestamp,
      value: generateSineWaveValue(baseUtilization, 8, 0.3, i * 0.4),
      registerType: 'input',
      address: 2
    };
  });
};

// Export static data for initial render
export const performanceData = generatePerformanceData();
export const resourceData = generateResourceData();