import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Device, DeviceMetric } from "@/types/device";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { DeviceSimulation } from "@/types/simulation";
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
            status: 'active' as const,
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
          if (payload.new) {
            const newData = payload.new as DeviceSimulation;
            setDevices(currentDevices => 
              currentDevices.map(device => 
                device.id === newData.device_id
                  ? {
                      ...device,
                      status: newData.is_running ? 'active' as const : 'warning' as const,
                      metrics: updateDeviceMetrics(device.metrics, newData.parameters)
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
        deviceId,
        timestamp: new Date().toISOString()
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