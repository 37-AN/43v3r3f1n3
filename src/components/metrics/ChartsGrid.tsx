import { MetricsChart } from "@/components/MetricsChart";
import { ModbusRegisterData } from "@/types/modbus";

interface ChartsGridProps {
  performanceData: ModbusRegisterData[];
  resourceData: ModbusRegisterData[];
}

export function ChartsGrid({ performanceData, resourceData }: ChartsGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="w-full min-h-[400px] p-4">
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
      <div className="w-full min-h-[400px] p-4">
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