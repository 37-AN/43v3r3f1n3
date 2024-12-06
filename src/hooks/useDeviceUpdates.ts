import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Device, initialDevices } from "@/types/device";

export const useDeviceUpdates = () => {
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  useEffect(() => {
    const deviceUpdates = supabase
      .channel('device-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_simulations',
        },
        (payload) => {
          console.log('Received device update:', payload);
          if (payload.new && payload.eventType === 'INSERT') {
            setDevices(currentDevices => 
              currentDevices.map(device => {
                if (device.id === payload.new.device_id) {
                  console.log('Updating device with simulation params:', payload.new.parameters);
                  return {
                    ...device,
                    status: 'active',
                    metrics: device.metrics.map(metric => ({
                      ...metric,
                      value: typeof metric.value === 'number' 
                        ? metric.value + (Math.random() - 0.5) * 10 
                        : metric.value
                    }))
                  };
                }
                return device;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      deviceUpdates.unsubscribe();
    };
  }, []);

  return devices;
};