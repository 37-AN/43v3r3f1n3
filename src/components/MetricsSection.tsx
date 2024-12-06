import { MetricsChart } from "@/components/MetricsChart";
import { TimeSeriesDataPoint } from "@/utils/dataRefinement";

interface MetricsSectionProps {
  refinedPerformance: TimeSeriesDataPoint[];
  refinedResources: TimeSeriesDataPoint[];
}

export const MetricsSection = ({ refinedPerformance, refinedResources }: MetricsSectionProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MetricsChart
        title="System Performance"
        data={refinedPerformance}
        className="transition-transform hover:scale-[1.01]"
      />
      <MetricsChart
        title="Resource Utilization"
        data={refinedResources}
        className="transition-transform hover:scale-[1.01]"
      />
    </div>
  );
};