import { MetricsChart } from "@/components/MetricsChart";
import { ModbusRegisterData } from "@/types/modbus";

interface ChartsGridProps {
  performanceData: ModbusRegisterData[];
  resourceData: ModbusRegisterData[];
}

export function ChartsGrid({ performanceData, resourceData }: ChartsGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-[400px]">
        <MetricsChart
          title="System Performance"
          data={performanceData.map(data => ({
            ...data,
            registerType: 'holding',
            address: 1
          }))}
          registerType="holding"
          className="transition-transform hover:scale-[1.01]"
        />
      </div>
      <div className="h-[400px]">
        <MetricsChart
          title="Resource Utilization"
          data={resourceData.map(data => ({
            ...data,
            registerType: 'input',
            address: 2
          }))}
          registerType="input"
          className="transition-transform hover:scale-[1.01]"
        />
      </div>
    </div>
  );
}