import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { defaultSimulationConfig } from "@/types/industrialSimulation";
import { SimulationControls } from "@/features/simulation/components/SimulationControls";
import { SimulationHistory } from "@/features/simulation/components/SimulationHistory";
import { IndustrialSimulationEngine } from "@/utils/industrial/simulationEngine";

interface WriteHistoryEntry {
  timestamp: string;
  metric: string;
  value: number;
}

export function SimulationControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [writeHistory, setWriteHistory] = useState<WriteHistoryEntry[]>([]);
  const [simulationEngine] = useState(() => new IndustrialSimulationEngine(defaultSimulationConfig));
  const [selectedMetric, setSelectedMetric] = useState<string>('');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(async () => {
        const values = simulationEngine.generateNextValues();
        
        try {
          // Store each metric as a separate data point
          for (const [metric, value] of Object.entries(values)) {
            const [category, name] = metric.split('.');
            
            const { error } = await supabase
              .from('arduino_plc_data')
              .insert({
                device_id: 'e2fae487-1ee2-4ea2-b87f-decedb7d12a5',
                data_type: `${category}_${name}`,
                value: value,
                metadata: {
                  category,
                  name,
                  simulation: true
                }
              });

            if (error) throw error;
          }

          // Update history with latest values
          setWriteHistory(prev => [
            ...Object.entries(values).map(([metric, value]) => ({
              timestamp: new Date().toISOString(),
              metric,
              value
            })),
            ...prev
          ].slice(0, 50));

        } catch (error) {
          console.error('Error storing simulation data:', error);
          toast.error('Failed to store simulation data');
          setIsRunning(false);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, simulationEngine]);

  const handleInjectAnomaly = async () => {
    if (!selectedMetric) {
      toast.error('Please select a metric first');
      return;
    }

    simulationEngine.injectAnomaly(selectedMetric, 'medium');
    toast.success(`Injected anomaly for ${selectedMetric}`);
  };

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
      
      <SimulationHistory writeHistory={writeHistory} />
    </div>
  );
}