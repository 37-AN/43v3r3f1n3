import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Device, DeviceMetric } from '@/types/device';
import { toast } from "sonner";
import { DeviceSimulation } from '@/types/simulation';

interface UseDeviceUpdatesReturn {
  devices: Device[];
  updateRegisterValue: (deviceId: string, address: number, value: number) => Promise<void>;
}

export function useDeviceUpdates(): UseDeviceUpdatesReturn {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        console.log('Fetching PLC devices...');
        const { data, error } = await supabase
          .from('plc_devices')
          .select('*');

        if (error) {
          console.error('Error fetching devices:', error);
          toast.error('Failed to fetch devices');
          return;
        }

        console.log('Fetched devices:', data);
        
        const initialDevices: Device[] = data.map(device => ({
          id: device.id,
          name: device.name,
          status: 'active',
          metrics: [
            { label: 'Temperature', value: 0, unit: '°C' },
            { label: 'Pressure', value: 0, unit: 'PSI' },
            { label: 'Flow Rate', value: 0, unit: 'L/min' }
          ] as DeviceMetric[]
        }));

        setDevices(initialDevices);
      } catch (error) {
        console.error('Error in device fetch:', error);
        toast.error('Failed to load devices');
      }
    };

    fetchDevices();

    const channel = supabase.channel('device_updates');
    
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_simulations',
          filter: 'is_running=eq.true'
        },
        (payload) => {
          console.log('Received simulation update:', payload);
          const simulation = payload.new as DeviceSimulation;
          
          if (simulation && simulation.device_id) {
            setDevices(currentDevices => 
              currentDevices.map(device => {
                if (device.id === simulation.device_id) {
                  return {
                    ...device,
                    status: simulation.is_running ? 'active' : 'warning',
                    metrics: device.metrics.map(metric => ({
                      ...metric,
                      value: Math.random() * 100
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
      channel.unsubscribe();
    };
  }, []);

  const updateRegisterValue = async (deviceId: string, address: number, value: number) => {
    try {
      console.log(`Updating register value for device ${deviceId}, address ${address} to ${value}`);
      
      const { error } = await supabase
        .from('device_simulations')
        .update({
          parameters: {
            registers: [{ address, value }]
          }
        })
        .eq('device_id', deviceId);

      if (error) {
        console.error('Error updating register:', error);
        toast.error('Failed to update register value');
        return;
      }

      toast.success('Register value updated');
    } catch (error) {
      console.error('Error in register update:', error);
      toast.error('Failed to update register');
    }
  };

  return { devices, updateRegisterValue };
}