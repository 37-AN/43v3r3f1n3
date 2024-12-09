import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Device } from "@/types/device";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { DeviceSimulation, isValidSimulationPayload } from "@/types/simulation";
import { updateDeviceMetrics } from "@/utils/metricCalculations";
import { logRegisterOperation } from "@/utils/registerLogger";

export const useDeviceUpdates = () => {
  const [devices, setDevices] = useState<Device[]>([]);

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

    return () => {
      deviceUpdates.unsubscribe();
    };
  }, []);

  return devices;
};

export const useRegisterUpdates = (deviceId: string) => {
  const updateRegisterValue = async (registerId: string, newValue: number) => {
    try {
      console.log(`Updating register ${registerId} with value ${newValue}`);
      
      // Log the register update operation
      logRegisterOperation({
        operation: 'write',
        address: Number(registerId),
        value: newValue,
        timestamp: new Date().toISOString(),
        deviceId: deviceId
      });

      console.log(`Register value updated for device ${deviceId}`);
      
      return true;
    } catch (error) {
      console.error('Error updating register value:', error);
      return false;
    }
  };

  return { updateRegisterValue };
};