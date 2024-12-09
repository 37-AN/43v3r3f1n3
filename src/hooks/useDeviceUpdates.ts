import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Device, DeviceMetric } from '@/types/device';
import { toast } from "sonner";

export function useDeviceUpdates() {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        console.log('Fetching PLC devices...');
        const { data, error } = await supabase
          .from('plc_devices')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching devices:', error);
          toast.error('Failed to fetch devices');
          return;
        }

        console.log('Fetched devices:', data);
        
        const initialDevices = data.map(device => ({
          id: device.id,
          name: device.name,
          status: 'active' as const,
          metrics: [
            { name: 'Temperature', value: 0, unit: '°C' },
            { name: 'Pressure', value: 0, unit: 'PSI' },
            { name: 'Flow Rate', value: 0, unit: 'L/min' }
          ]
        }));

        setDevices(initialDevices);
      } catch (error) {
        console.error('Error in device fetch:', error);
        toast.error('Failed to load devices');
      }
    };

    fetchDevices();

    // Subscribe to device simulation updates
    const subscription = supabase
      .channel('device_simulations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_simulations'
        },
        (payload) => {
          console.log('Received simulation update:', payload);
          if (!payload.new) return;

          setDevices(currentDevices => 
            currentDevices.map(device => {
              if (device.id === payload.new.device_id) {
                return {
                  ...device,
                  status: payload.new.is_running ? 'active' : 'warning',
                  metrics: device.metrics.map(metric => ({
                    ...metric,
                    value: Math.random() * 100 // Simulate new values
                  }))
                };
              }
              return device;
            })
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { devices };
}