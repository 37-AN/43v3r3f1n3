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

export const generatePerformanceData = (): ModbusRegisterData[] => {
  const basePerformance = 85; // Target performance around 85%
  console.log('Generating new performance data');
  
  return Array.from({ length: 24 }, (_, i) => {
    const currentTime = Date.now();
    const timestamp = new Date(currentTime - (23 - i) * (1000 * 60)).toLocaleTimeString();
    return {
      timestamp,
      value: generateSineWaveValue(basePerformance, 5, 0.5, i * 0.2),
      registerType: 'holding',
      address: 1
    };
  });
};

export const generateResourceData = (): ModbusRegisterData[] => {
  const baseUtilization = 65; // Target utilization around 65%
  console.log('Generating new resource data');
  
  return Array.from({ length: 24 }, (_, i) => {
    const currentTime = Date.now();
    const timestamp = new Date(currentTime - (23 - i) * (1000 * 60)).toLocaleTimeString();
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