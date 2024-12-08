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
    console.log('Setting up chart data update interval');
    const updateData = () => {
      const newPerformanceData = generatePerformanceData();
      const newResourceData = generateResourceData();
      console.log('Updating chart data:', { 
        performanceDataLength: newPerformanceData.length,
        resourceDataLength: newResourceData.length 
      });
      setPerformanceData(newPerformanceData);
      setResourceData(newResourceData);
    };

    // Initial update
    updateData();

    // Set up interval for updates
    const interval = setInterval(updateData, 2000);

    return () => {
      console.log('Cleaning up chart data update interval');
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1400px] mx-auto animate-fade-in">
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