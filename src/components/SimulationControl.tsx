import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RegisterForm } from "./simulation/RegisterForm";
import { WriteHistory } from "./simulation/WriteHistory";
import { IndustrialSimulationEngine } from "@/utils/industrial/simulationEngine";
import { defaultSimulationConfig } from "@/types/industrialSimulation";
import { Button } from "./ui/button";
import { AlertCircle, Play, Square } from "lucide-react";

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
          <h3 className="text-lg font-semibold text-system-gray-900">Industrial Simulation Control</h3>
          <div className="flex gap-2">
            <Button
              variant={isRunning ? "destructive" : "default"}
              onClick={() => setIsRunning(!isRunning)}
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
              onClick={handleInjectAnomaly}
              disabled={!selectedMetric}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Inject Anomaly
            </Button>
          </div>
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
      
      <Card className="p-4">
        <h4 className="text-md font-semibold mb-2">Simulation History</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {writeHistory.map((entry, index) => (
            <div 
              key={index}
              className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center"
            >
              <span className="text-sm font-medium">{entry.metric}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {entry.value.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}