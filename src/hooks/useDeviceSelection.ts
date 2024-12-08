import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  useEffect(() => {
    const fetchFirstDevice = async () => {
      const { data, error } = await supabase
        .from('plc_devices')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (data) {
        setSelectedDeviceId(data.id);
      }
    };

    fetchFirstDevice();
  }, []);

  return selectedDeviceId;
};