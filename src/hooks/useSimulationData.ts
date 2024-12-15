import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IndustrialSimulationEngine } from "@/utils/industrial/simulationEngine";

export const useSimulationData = (
  isRunning: boolean,
  deviceId: string | null,
  simulationEngine: IndustrialSimulationEngine
) => {
  const [writeHistory, setWriteHistory] = useState<Array<{
    timestamp: string;
    metric: string;
    value: number;
  }>>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && deviceId) {
      interval = setInterval(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.error('No active session');
            toast.error('Please log in to run simulation');
            return;
          }

          const values = simulationEngine.generateNextValues();
          console.log('Generated simulation values:', values);

          // Format metrics array
          const metricsArray = Object.entries(values).map(([key, value]) => ({
            metric_type: key,
            value: typeof value === 'number' ? value : 0,
            timestamp: new Date().toISOString(),
            unit: key === 'temperature' ? '°C' :
                  key === 'pressure' ? 'bar' :
                  key === 'vibration' ? 'mm/s' :
                  key === 'efficiency' ? '%' :
                  key === 'energy_consumption' ? 'kWh' : 'unit',
            metadata: {
              quality_score: 0.95,
              source: 'simulation_engine',
              simulation: true
            }
          }));

          // Send to data refinery with proper request body structure
          const refineryRequestBody = {
            rawData: {
              deviceId,
              metrics: metricsArray,
              timestamp: new Date().toISOString(),
              metadata: {
                simulation: true,
                source: 'simulation_engine',
                quality_score: 0.95,
                owner_id: session.user.id
              }
            }
          };

          console.log('Sending data to refinery:', refineryRequestBody);

          const { data: refinedData, error: refineryError } = await supabase.functions.invoke(
            'industrial-data-refinery',
            {
              body: refineryRequestBody
            }
          );

          if (refineryError) {
            console.error('Error in data refinement:', refineryError);
            throw refineryError;
          }

          console.log('Received refined data:', refinedData);

          // Update history
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
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, deviceId, simulationEngine]);

  return { writeHistory };
};