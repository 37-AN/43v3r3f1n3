import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Device, initialDevices } from "@/types/device";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

type DeviceSimulation = Database['public']['Tables']['device_simulations']['Row'];

interface SimulationParameters {
  port: number;
  slave_id: number;
  registers: Array<{
    address: number;
    value: number;
  }>;
}

export const useDeviceUpdates = () => {
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  useEffect(() => {
    // Subscribe to device simulation updates
    const deviceUpdates = supabase
      .channel('device-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_simulations',
        },
        (payload: RealtimePostgresChangesPayload<DeviceSimulation>) => {
          console.log('Received device update:', payload);
          
          if (payload.new && 'device_id' in payload.new) {
            setDevices(currentDevices => 
              currentDevices.map(device => {
                if (device.id === payload.new.device_id) {
                  // Generate simulated metrics based on simulation parameters
                  const updatedMetrics = device.metrics.map(metric => ({
                    ...metric,
                    value: typeof metric.value === 'number' 
                      ? generateMetricValue(metric.value, payload.new.parameters as SimulationParameters)
                      : metric.value
                  }));

                  console.log('Updated metrics for device:', device.id, updatedMetrics);

                  return {
                    ...device,
                    status: payload.new.is_running ? 'active' : 'warning',
                    metrics: updatedMetrics
                  };
                }
                return device;
              })
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Start periodic updates for active simulations
    const updateInterval = setInterval(() => {
      setDevices(currentDevices => 
        currentDevices.map(device => {
          if (device.status === 'active') {
            return {
              ...device,
              metrics: device.metrics.map(metric => ({
                ...metric,
                value: typeof metric.value === 'number'
                  ? metric.value + (Math.random() - 0.5) * 5 // Add some random variation
                  : metric.value
              }))
            };
          }
          return device;
        })
      );
    }, 2000); // Update every 2 seconds

    return () => {
      deviceUpdates.unsubscribe();
      clearInterval(updateInterval);
    };
  }, []);

  // Helper function to generate metric values based on simulation parameters
  const generateMetricValue = (currentValue: number, parameters: SimulationParameters) => {
    // Use simulation parameters to influence the generated values
    const baseVariation = (Math.random() - 0.5) * 10;
    const parameterInfluence = parameters?.registers?.length || 1;
    return currentValue + (baseVariation * parameterInfluence);
  };

  return devices;
};