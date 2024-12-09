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

          // Format metrics array with validation
          const metricsArray = Object.entries(values)
            .filter(([_, value]) => typeof value === 'number' && !isNaN(value))
            .map(([key, value]) => ({
              metric_type: key,
              value: value,
              timestamp: new Date().toISOString(),
              unit: 'unit',
              metadata: {
                quality_score: 0.95,
                source: 'simulation_engine'
              }
            }));

          if (metricsArray.length === 0) {
            console.error('No valid metrics generated');
            return;
          }

          // Send to data refinery
          console.log('Sending metrics to refinery:', { deviceId, metricsArray });
          const { data: refinedData, error: refineryError } = await supabase.functions.invoke(
            'industrial-data-refinery',
            {
              body: { 
                rawData: {
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
                }
              }
            }
          );

          if (refineryError) {
            console.error('Refinery error:', refineryError);
            throw refineryError;
          }
          console.log('Received refined data:', refinedData);

          // Send to MES engine
          const { error: mesError } = await supabase.functions.invoke(
            'mes-tokenization-engine',
            {
              body: {
                refinedData: {
                  ...refinedData,
                  metadata: {
                    ...refinedData.metadata,
                    owner_id: session.user.id
                  }
                }
              }
            }
          );

          if (mesError) {
            console.error('MES error:', mesError);
            throw mesError;
          }

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