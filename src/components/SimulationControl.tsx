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

  // Convert register writes to simulation metrics
  const formattedHistory: WriteHistoryEntry[] = writeHistory.map(entry => {
    // Map register addresses to meaningful metrics
    const metricMap: Record<number, string> = {
      0: 'temperature',
      1: 'pressure',
      2: 'vibration',
      3: 'efficiency',
      4: 'energy_consumption'
    };

    const metric = metricMap[entry.address] || `register_${entry.address}`;
    let value = entry.value;
    
    // Add appropriate units based on metric type
    if (metric === 'temperature') {
      value = (value / 10); // Assuming temperature is stored with 1 decimal place
    } else if (metric === 'pressure') {
      value = (value / 100); // Assuming pressure is stored with 2 decimal places
    } else if (metric === 'efficiency') {
      value = Math.min(100, Math.max(0, value));
    }

    return {
      timestamp: entry.timestamp,
      metric: metric.charAt(0).toUpperCase() + metric.slice(1).replace(/_/g, ' '),
      value
    };
  });

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