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

  const performanceChange = calculateChange(performanceData);
  const resourceChange = calculateChange(resourceData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Average Performance"
        value={`${performanceData.length > 0
          ? Math.round(performanceData[performanceData.length - 1].value)
          : 0}%`}
        change={performanceChange}
      />
      <MetricCard
        title="Resource Utilization"
        value={`${resourceData.length > 0
          ? Math.round(resourceData[resourceData.length - 1].value)
          : 0}%`}
        change={resourceChange}
      />
      <MetricCard
        title="Active Devices"
        value="3"
        change={0}
        status="Active"
      />
      <MetricCard
        title="System Health"
        value="98%"
        change={0}
        status="Optimal"
      />
    </div>
  );
}