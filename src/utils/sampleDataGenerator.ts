import { ModbusRegisterData } from "@/types/modbus";

// Simulate realistic industrial data patterns
const generateIndustrialValue = (baseValue: number, variation: number): number => {
  // Add some noise and periodic fluctuations
  const noise = (Math.random() - 0.5) * variation;
  const periodicComponent = Math.sin(Date.now() / 10000) * variation * 0.5;
  return Number((baseValue + noise + periodicComponent).toFixed(2));
};

// Generate performance data with realistic patterns
export const performanceData: ModbusRegisterData[] = Array.from({ length: 24 }, (_, i) => {
  const basePerformance = 85; // Target performance around 85%
  const timestamp = new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString();
  return {
    timestamp,
    value: generateIndustrialValue(basePerformance, 5),
    registerType: 'holding',
    address: 1
  };
});

// Generate resource utilization data
export const resourceData: ModbusRegisterData[] = Array.from({ length: 24 }, (_, i) => {
  const baseUtilization = 65; // Target utilization around 65%
  const timestamp = new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString();
  return {
    timestamp,
    value: generateIndustrialValue(baseUtilization, 8),
    registerType: 'input',
    address: 2
  };
});