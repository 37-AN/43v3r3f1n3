import { Card } from "@/components/ui/card";
import { SimulationControls } from "@/features/simulation/components/SimulationControls";
import { SimulationMetricSelect } from "./SimulationMetricSelect";
import { toast } from "sonner";

interface SimulationPanelProps {
  isRunning: boolean;
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
  onToggleSimulation: () => void;
  onInjectAnomaly: () => void;
}

export function SimulationPanel({
  isRunning,
  selectedMetric,
  onMetricChange,
  onToggleSimulation,
  onInjectAnomaly
}: SimulationPanelProps) {
  const handleInjectAnomaly = () => {
    if (!selectedMetric) {
      toast.error('Please select a metric first');
      return;
    }
    onInjectAnomaly();
  };

  return (
    <Card className="p-6 animate-fade-up glass-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-system-gray-900">
          Industrial Simulation Control
        </h3>
        <SimulationControls 
          isRunning={isRunning}
          selectedMetric={selectedMetric}
          onToggleSimulation={onToggleSimulation}
          onInjectAnomaly={handleInjectAnomaly}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <SimulationMetricSelect
          selectedMetric={selectedMetric}
          onMetricChange={onMetricChange}
        />
      </div>
    </Card>
  );
}