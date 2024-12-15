import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { SimulationHistory } from "@/features/simulation/components/SimulationHistory";
import { SimulationPanel } from "./simulation/SimulationPanel";
import { useDeviceId } from "@/features/simulation/hooks/useDeviceId";
import { useSimulationData } from "@/hooks/useSimulationData";
import { toast } from "sonner";
import { WriteHistoryEntry } from "@/types/simulation";
import { defaultSimulationConfig } from "@/types/industrialSimulation";
import { IndustrialSimulationEngine } from "@/utils/industrial/simulationEngine";

export function SimulationControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [simulationEngine] = useState(() => new IndustrialSimulationEngine(defaultSimulationConfig));
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const { deviceId, isLoading } = useDeviceId();
  const { writeHistory } = useSimulationData(isRunning, deviceId, simulationEngine);

  useEffect(() => {
    if (!deviceId) {
      setIsRunning(false);
    }
  }, [deviceId]);

  const handleInjectAnomaly = () => {
    simulationEngine.injectAnomaly(selectedMetric, 'medium');
    toast.success(`Injected anomaly for ${selectedMetric}`);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Loading...</h3>
          <p className="text-gray-600">Please wait while we load your device information.</p>
        </div>
      </Card>
    );
  }

  if (!deviceId) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Device Available</h3>
          <p className="text-gray-600">Please add a PLC device to start simulation.</p>
        </div>
      </Card>
    );
  }

  // Convert metrics to history entries
  const formattedHistory: WriteHistoryEntry[] = writeHistory.map(entry => ({
    timestamp: entry.timestamp,
    metric: entry.metric,
    value: entry.value
  }));

  return (
    <div className="space-y-4">
      <SimulationPanel
        isRunning={isRunning}
        selectedMetric={selectedMetric}
        onMetricChange={setSelectedMetric}
        onToggleSimulation={() => setIsRunning(!isRunning)}
        onInjectAnomaly={handleInjectAnomaly}
      />
      
      <SimulationHistory writeHistory={formattedHistory} />
    </div>
  );
}