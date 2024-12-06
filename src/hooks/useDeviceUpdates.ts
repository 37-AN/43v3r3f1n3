import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Device, initialDevices } from "@/types/device";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { DeviceSimulation, isValidSimulationPayload } from "@/types/simulation";
import { updateDeviceMetrics } from "@/utils/metricCalculations";

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
          
          if (payload.new && isValidSimulationPayload(payload.new)) {
            const newPayload = payload.new;
            const parameters = newPayload.parameters;

            setDevices(currentDevices => 
              currentDevices.map(device => {
                if (device.id === newPayload.device_id) {
                  const updatedMetrics = updateDeviceMetrics(device.metrics, parameters);
                  console.log('Updated metrics for device:', device.id, updatedMetrics);

                  return {
                    ...device,
                    status: newPayload.is_running ? 'active' : 'warning',
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
              metrics: updateDeviceMetrics(device.metrics, null)
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

  return devices;
};