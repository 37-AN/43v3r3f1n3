import { useEffect, useState } from 'react';
import { MetricsChart } from "@/components/MetricsChart";
import { ModbusRegisterData } from "@/types/modbus";
import { generatePerformanceData, generateResourceData } from "@/utils/sampleDataGenerator";

interface ChartsGridProps {
  performanceData: ModbusRegisterData[];
  resourceData: ModbusRegisterData[];
}

export function ChartsGrid({ performanceData: initialPerformanceData, resourceData: initialResourceData }: ChartsGridProps) {
  const [performanceData, setPerformanceData] = useState(initialPerformanceData);
  const [resourceData, setResourceData] = useState(initialResourceData);

  useEffect(() => {
    // Update data every 2 seconds
    const interval = setInterval(() => {
      setPerformanceData(generatePerformanceData());
      setResourceData(generateResourceData());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[1400px] mx-auto">
      <div className="w-full h-[300px]">
        <MetricsChart
          title="System Performance"
          data={performanceData.map(data => ({
            ...data,
            registerType: 'holding',
            address: 1
          }))}
          registerType="holding"
          className="h-full transition-transform hover:scale-[1.01]"
        />
      </div>
      <div className="w-full h-[300px]">
        <MetricsChart
          title="Resource Utilization"
          data={resourceData.map(data => ({
            ...data,
            registerType: 'input',
            address: 2
          }))}
          registerType="input"
          className="h-full transition-transform hover:scale-[1.01]"
        />
      </div>
    </div>
  );
}