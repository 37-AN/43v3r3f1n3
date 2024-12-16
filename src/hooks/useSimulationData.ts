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

          const dataPoint = simulationEngine.generateDataPoint(`PLC_${deviceId}`);
          console.log('Generated simulation data:', dataPoint);

          // Format metrics array for the data refinery
          const metricsArray = [
            {
              metric_type: 'temperature',
              value: dataPoint.temperature_C,
              timestamp: dataPoint.timestamp,
              unit: '°C',
              metadata: {
                quality_score: dataPoint.metadata.quality_score,
                source: dataPoint.source,
                error_state: null
              }
            },
            {
              metric_type: 'pressure',
              value: dataPoint.pressure_bar,
              timestamp: dataPoint.timestamp,
              unit: 'bar',
              metadata: {
                quality_score: dataPoint.metadata.quality_score,
                source: dataPoint.source,
                error_state: null
              }
            },
            {
              metric_type: 'flow_rate',
              value: dataPoint.flow_rate_m3_s,
              timestamp: dataPoint.timestamp,
              unit: 'm³/s',
              metadata: {
                quality_score: dataPoint.metadata.quality_score,
                source: dataPoint.source,
                error_state: null
              }
            }
          ];

          // Structure request body according to the Edge Function's requirements
          const refineryRequestBody = {
            rawData: {
              deviceId: deviceId,
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

          console.log('Sending data to refinery:', JSON.stringify(refineryRequestBody, null, 2));

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

          // Update history with new data points
          setWriteHistory(prev => [
            ...metricsArray.map(metric => ({
              timestamp: metric.timestamp,
              metric: metric.metric_type,
              value: metric.value
            })),
            ...prev
          ].slice(0, 50)); // Keep last 50 entries

          console.log('Successfully processed simulation data');
        } catch (error) {
          console.error('Error in simulation pipeline:', error);
          toast.error('Failed to process simulation data');
        }
      }, 2000); // Generate data every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, deviceId, simulationEngine]);

  return { writeHistory };
};