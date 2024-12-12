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

  const formattedHistory: WriteHistoryEntry[] = writeHistory.map(entry => {
    // Format the metric name to be more readable
    const metricName = entry.metric.includes('.')
      ? entry.metric.split('.').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, ' ')
        ).join(' - ')
      : entry.metric.charAt(0).toUpperCase() + entry.metric.slice(1).replace(/_/g, ' ');

    // Add appropriate units based on metric type
    let formattedValue = entry.value;
    let unit = '';
    
    if (entry.metric.includes('temperature')) {
      unit = '°C';
    } else if (entry.metric.includes('pressure')) {
      unit = 'bar';
    } else if (entry.metric.includes('vibration')) {
      unit = 'mm/s';
    } else if (entry.metric.includes('efficiency') || entry.metric.includes('rate')) {
      unit = '%';
      formattedValue = Math.min(100, Math.max(0, formattedValue));
    } else if (entry.metric.includes('energy')) {
      unit = 'kWh';
    }

    return {
      timestamp: entry.timestamp,
      metric: metricName,
      value: unit ? `${formattedValue.toFixed(2)}${unit}` : formattedValue.toFixed(2)
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