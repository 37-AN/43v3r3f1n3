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

          // Format metrics array with proper structure
          const metricsArray = [
            {
              metric_type: 'temperature',
              value: dataPoint.temperature_C,
              timestamp: dataPoint.timestamp,
              unit: '°C',
              metadata: {
                quality_score: dataPoint.metadata.quality_score,
                source: dataPoint.source,
                error_state: dataPoint.metadata.error_state
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
                error_state: dataPoint.metadata.error_state
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
                error_state: dataPoint.metadata.error_state
              }
            },
            {
              metric_type: 'energy_consumption',
              value: dataPoint.energy_consumption_kWh,
              timestamp: dataPoint.timestamp,
              unit: 'kWh',
              metadata: {
                quality_score: dataPoint.metadata.quality_score,
                source: dataPoint.source,
                error_state: dataPoint.metadata.error_state
              }
            }
          ];

          // Ensure proper request format with rawData object
          const requestBody = {
            rawData: {
              deviceId,
              metrics: metricsArray,
              timestamp: dataPoint.timestamp,
              metadata: {
                simulation: true,
                source: dataPoint.source,
                machine_state: dataPoint.machine_state,
                quality_score: dataPoint.metadata.quality_score,
                owner_id: session.user.id
              }
            }
          };

          console.log('Sending data to refinery:', requestBody);

          const { data: refinedData, error: refineryError } = await supabase.functions.invoke(
            'industrial-data-refinery',
            {
              body: requestBody
            }
          );

          if (refineryError) {
            console.error('Error in data refinement:', refineryError);
            throw refineryError;
          }

          console.log('Received refined data:', refinedData);

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