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
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Fetch first available device
  useEffect(() => {
    const fetchFirstDevice = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No active session');
          return;
        }

        console.log('Fetching first available PLC device');
        const { data: devices, error } = await supabase
          .from('plc_devices')
          .select('id')
          .eq('owner_id', session.user.id)
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching PLC device:', error);
          toast.error('Error loading device');
          return;
        }

        if (devices) {
          console.log('Found device:', devices.id);
          setDeviceId(devices.id);
        } else {
          console.log('No devices found');
          toast.error('No devices found. Please add a device first.');
        }
      } catch (error) {
        console.error('Error in device fetch:', error);
        toast.error('Failed to load device');
      }
    };

    fetchFirstDevice();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && deviceId) {
      interval = setInterval(async () => {
        const values = simulationEngine.generateNextValues();
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.error('No active session');
            toast.error('Please log in to run simulation');
            setIsRunning(false);
            return;
          }

          // Format metrics array for processing
          const metricsArray = Object.entries(values).map(([key, value]) => ({
            metric_type: key,
            value: typeof value === 'number' ? value : 0,
            timestamp: new Date().toISOString(),
            unit: 'unit',
            metadata: {
              quality_score: 0.95,
              source: 'simulation_engine'
            }
          }));
          
          console.log('Sending metrics to refinery:', { deviceId, metricsArray });
          
          // Format data for industrial-data-refinery
          const rawData = {
            deviceId,
            dataType: 'simulation',
            metrics: metricsArray,
            timestamp: new Date().toISOString(),
            metadata: {
              simulation: true,
              source: 'simulation_engine',
              quality_score: 0.95,
              owner_id: session.user.id
            }
          };

          const { data: refinedData, error: refineryError } = await supabase.functions.invoke(
            'industrial-data-refinery',
            {
              body: { rawData }
            }
          );

          if (refineryError) {
            console.error('Error in data refinement:', refineryError);
            throw refineryError;
          }

          console.log('Received refined data:', refinedData);

          if (!refinedData || !refinedData.metrics) {
            console.error('Invalid refined data structure:', refinedData);
            throw new Error('Invalid refined data received from refinery');
          }

          // Format data for MES tokenization engine
          const mesData = {
            refinedData: {
              deviceId: refinedData.deviceId,
              metrics: refinedData.metrics,
              dataType: refinedData.dataType || 'simulation',
              timestamp: new Date().toISOString(),
              metadata: {
                quality_score: refinedData.metadata?.quality_score || 0.95,
                source: 'industrial_refinery',
                simulation: true,
                source_device_id: deviceId,
                owner_id: session.user.id
              }
            }
          };

          console.log('Sending data to MES engine:', mesData);
          
          const { error: mesError } = await supabase.functions.invoke(
            'mes-tokenization-engine',
            { body: mesData }
          );

          if (mesError) {
            console.error('Error in MES tokenization:', mesError);
            throw mesError;
          }

          // Update history with latest values
          setWriteHistory(prev => [
            ...metricsArray.map(metric => ({
              timestamp: metric.timestamp,
              metric: metric.metric_type,
              value: metric.value
            })),
            ...prev
          ].slice(0, 50));

          console.log('Successfully processed simulation data');

        } catch (error) {
          console.error('Error in simulation pipeline:', error);
          toast.error('Failed to process simulation data');
          setIsRunning(false);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, simulationEngine, deviceId]);

  const handleInjectAnomaly = async () => {
    if (!selectedMetric) {
      toast.error('Please select a metric first');
      return;
    }

    simulationEngine.injectAnomaly(selectedMetric, 'medium');
    toast.success(`Injected anomaly for ${selectedMetric}`);
  };

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