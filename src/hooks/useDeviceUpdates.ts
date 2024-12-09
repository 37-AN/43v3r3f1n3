import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Device } from "@/types/device";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { DeviceSimulation, isValidSimulationPayload } from "@/types/simulation";
import { updateDeviceMetrics } from "@/utils/metricCalculations";
import { logRegisterOperation } from "@/utils/registerLogger";
import { toast } from "sonner";

export const useDeviceUpdates = () => {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('No active session');
          return;
        }

        const { data, error } = await supabase
          .from('plc_devices')
          .select('*')
          .eq('owner_id', session.user.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching devices:', error);
          toast.error('Failed to fetch devices');
          return;
        }

        console.log('Fetched devices:', data);
        if (data) {
          setDevices(data.map(device => ({
            id: device.id,
            name: device.name,
            status: 'active',
            metrics: []
          })));
        }
      } catch (error) {
        console.error('Error in device fetch:', error);
        toast.error('Failed to load devices');
      }
    };

    fetchDevices();

    const deviceUpdates = supabase
      .channel('device_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_simulations'
        },
        (payload: RealtimePostgresChangesPayload<DeviceSimulation>) => {
          console.log('Device simulation update:', payload);
          if (payload.new && isValidSimulationPayload(payload.new)) {
            setDevices(currentDevices => 
              currentDevices.map(device => 
                device.id === payload.new.device_id
                  ? {
                      ...device,
                      status: payload.new.is_running ? 'active' : 'inactive',
                      metrics: updateDeviceMetrics(device.metrics, payload.new.parameters)
                    }
                  : device
              )
            );
          }
        }
      )
      .subscribe(status => {
        console.log('Subscription status:', status);
      });

    return () => {
      deviceUpdates.unsubscribe();
    };
  }, []);

  const updateRegisterValue = async (
    deviceId: string,
    address: number,
    value: number
  ) => {
    try {
      console.log(`Updating register for device ${deviceId}:`, { address, value });
      
      await logRegisterOperation({
        operation: 'write',
        value,
        address,
        deviceId: deviceId
      });

      console.log(`Register value updated for device ${deviceId}`);
      
      return true;
    } catch (error) {
      console.error('Error updating register:', error);
      return false;
    }
  };

  return { devices, updateRegisterValue };
};