import { MetricCard } from "./MetricCard";
import { ModbusRegisterData } from "@/types/modbus";

interface MetricsGridProps {
  performanceData: ModbusRegisterData[];
  resourceData: ModbusRegisterData[];
}

export function MetricsGrid({ performanceData, resourceData }: MetricsGridProps) {
  const calculateChange = (data: ModbusRegisterData[]) => {
    if (data.length < 2) return 0;
    const latest = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    return ((latest - previous) / previous) * 100;
  };

  const getEfficiencyStatus = (value: number) => {
    if (value >= 90) return "Optimal";
    if (value >= 75) return "Good";
    if (value >= 60) return "Fair";
    return "Needs Attention";
  };

  const performanceChange = calculateChange(performanceData);
  const resourceChange = calculateChange(resourceData);
  const currentPerformance = performanceData[performanceData.length - 1]?.value || 0;
  const currentResource = resourceData[resourceData.length - 1]?.value || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Production Efficiency"
        value={`${currentPerformance.toFixed(1)}%`}
        change={performanceChange}
        status={getEfficiencyStatus(currentPerformance)}
      />
      <MetricCard
        title="Resource Utilization"
        value={`${currentResource.toFixed(1)}%`}
        change={resourceChange}
        status={getEfficiencyStatus(currentResource)}
      />
      <MetricCard
        title="Equipment Health"
        value="98.5%"
        change={0.5}
        status="Optimal"
      />
      <MetricCard
        title="Energy Consumption"
        value={`${(currentResource * 1.5).toFixed(1)} kW`}
        change={resourceChange * 1.2}
        status={resourceChange > 0 ? "Increasing" : "Stable"}
      />
    </div>
  );
}