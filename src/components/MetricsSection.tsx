import { ModbusRegisterData } from "@/types/modbus";
import { MetricsGrid } from "./metrics/MetricsGrid";
import { ChartsGrid } from "./metrics/ChartsGrid";

interface MetricsSectionProps {
  refinedPerformance: ModbusRegisterData[];
  refinedResources: ModbusRegisterData[];
}

export const MetricsSection = ({ refinedPerformance, refinedResources }: MetricsSectionProps) => {
  return (
    <div className="space-y-8 animate-fade-up">
      <MetricsGrid 
        performanceData={refinedPerformance}
        resourceData={refinedResources}
      />
      <ChartsGrid 
        performanceData={refinedPerformance}
        resourceData={refinedResources}
      />
    </div>
  );
}