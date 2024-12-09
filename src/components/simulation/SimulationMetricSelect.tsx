import { Label } from "@/components/ui/label";
import { defaultSimulationConfig } from "@/types/industrialSimulation";

interface SimulationMetricSelectProps {
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
}

export function SimulationMetricSelect({ selectedMetric, onMetricChange }: SimulationMetricSelectProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Select Metric for Anomaly</Label>
      <select
        className="w-full border rounded p-2 text-sm"
        value={selectedMetric}
        onChange={(e) => onMetricChange(e.target.value)}
      >
        <option value="">Select metric for anomaly</option>
        {Object.entries(defaultSimulationConfig).map(([category, metrics]) => (
          Object.keys(metrics).map(metric => (
            <option key={`${category}.${metric}`} value={`${category}.${metric}`}>
              {`${category} - ${metric}`}
            </option>
          ))
        ))}
      </select>
    </div>
  );
}