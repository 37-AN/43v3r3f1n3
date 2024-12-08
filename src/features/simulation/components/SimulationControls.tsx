import { Button } from "@/components/ui/button";
import { Play, Square, AlertCircle } from "lucide-react";

interface SimulationControlsProps {
  isRunning: boolean;
  selectedMetric: string;
  onToggleSimulation: () => void;
  onInjectAnomaly: () => void;
}

export function SimulationControls({
  isRunning,
  selectedMetric,
  onToggleSimulation,
  onInjectAnomaly
}: SimulationControlsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={isRunning ? "destructive" : "default"}
        onClick={onToggleSimulation}
      >
        {isRunning ? (
          <>
            <Square className="w-4 h-4 mr-2" />
            Stop
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Start
          </>
        )}
      </Button>
      <Button
        variant="outline"
        onClick={onInjectAnomaly}
        disabled={!selectedMetric}
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        Inject Anomaly
      </Button>
    </div>
  );
}