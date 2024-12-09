import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFirstDevice = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No active session');
          setIsLoading(false);
          return;
        }

        console.log('Fetching first available PLC device');
        const { data: devices, error } = await supabase
          .from('plc_devices')
          .select('id')
          .eq('owner_id', session.user.id)
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching PLC device:', error);
          toast.error('Error loading device');
          setIsLoading(false);
          return;
        }

        if (devices) {
          console.log('Found device:', devices.id);
          setDeviceId(devices.id);
        } else {
          console.log('No devices found');
          toast.error('No devices found. Please add a device first.');
        }
      } catch (error) {
        console.error('Error in device fetch:', error);
        toast.error('Failed to load device');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirstDevice();
  }, []);

  return { deviceId, isLoading };
};