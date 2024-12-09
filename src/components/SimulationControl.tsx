import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { SimulationControls } from "@/features/simulation/components/SimulationControls";
import { SimulationHistory } from "@/features/simulation/components/SimulationHistory";
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

  const handleInjectAnomaly = async () => {
    if (!selectedMetric) {
      toast.error('Please select a metric first');
      return;
    }

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

  // Convert RegisterWriteHistoryEntry to WriteHistoryEntry
  const formattedHistory: WriteHistoryEntry[] = writeHistory.map(entry => ({
    timestamp: entry.timestamp,
    metric: `Register ${entry.address}`,
    value: entry.value
  }));

  return (
    <div className="space-y-4">
      <Card className="p-6 animate-fade-up glass-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-system-gray-900">
            Industrial Simulation Control
          </h3>
          <SimulationControls 
            isRunning={isRunning}
            selectedMetric={selectedMetric}
            onToggleSimulation={() => setIsRunning(!isRunning)}
            onInjectAnomaly={handleInjectAnomaly}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <select
            className="border rounded p-2"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
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
      </Card>
      
      <SimulationHistory writeHistory={formattedHistory} />
    </div>
  );
}