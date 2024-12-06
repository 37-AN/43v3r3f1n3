import { MetricsChart } from "@/components/MetricsChart";
import { Card } from "@/components/ui/card";
import { TimeSeriesDataPoint } from "@/utils/dataRefinement";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface MetricsSectionProps {
  refinedPerformance: TimeSeriesDataPoint[];
  refinedResources: TimeSeriesDataPoint[];
}

export const MetricsSection = ({ refinedPerformance, refinedResources }: MetricsSectionProps) => {
  // Calculate percentage changes
  const calculateChange = (data: TimeSeriesDataPoint[]) => {
    if (data.length < 2) return 0;
    const latest = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    return ((latest - previous) / previous) * 100;
  };

  const performanceChange = calculateChange(refinedPerformance);
  const resourceChange = calculateChange(refinedResources);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 glass-panel">
          <h4 className="text-sm font-medium text-muted-foreground">Average Performance</h4>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-bold">
              {refinedPerformance.length > 0
                ? Math.round(refinedPerformance[refinedPerformance.length - 1].value)
                : 0}%
            </span>
            <div className={`flex items-center ${performanceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {performanceChange >= 0 ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
              <span className="ml-1 text-sm">{Math.abs(performanceChange).toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-panel">
          <h4 className="text-sm font-medium text-muted-foreground">Resource Utilization</h4>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-bold">
              {refinedResources.length > 0
                ? Math.round(refinedResources[refinedResources.length - 1].value)
                : 0}%
            </span>
            <div className={`flex items-center ${resourceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {resourceChange >= 0 ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
              <span className="ml-1 text-sm">{Math.abs(resourceChange).toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-panel">
          <h4 className="text-sm font-medium text-muted-foreground">Active Devices</h4>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-bold">3</span>
            <div className="text-green-500 flex items-center">
              <ArrowUpIcon className="w-4 h-4" />
              <span className="ml-1 text-sm">Active</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-panel">
          <h4 className="text-sm font-medium text-muted-foreground">System Health</h4>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-bold">98%</span>
            <div className="text-green-500 flex items-center">
              <ArrowUpIcon className="w-4 h-4" />
              <span className="ml-1 text-sm">Optimal</span>
            </div>
          </div>
        </Card>
      </div>

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
    </div>
  );
};