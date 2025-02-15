
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PLCData, PLCDevice } from "@/types/plc";
import { toast } from "sonner";

export function usePLCData(enabled: boolean) {
  const [plcData, setPlcData] = useState<PLCData | null>(null);
  const [devices, setDevices] = useState<PLCDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data: plcDevices, error } = await supabase
          .from('plc_devices')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching PLC devices:', error);
          toast.error('Failed to fetch PLC devices');
          return;
        }

        setDevices(plcDevices as PLCDevice[]);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load PLC devices');
      }
    };

    if (enabled) {
      fetchDevices();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || devices.length === 0) return;

    const processPLCData = async (rawData: any[]) => {
      const processedData: PLCData = {};
      
      rawData.forEach((dataPoint: any) => {
        const { address, value } = dataPoint;
        processedData[`Register ${address}`] = value;
      });
      
      return processedData;
    };

    const fetchPLCData = async () => {
      try {
        const { data: rawData, error } = await supabase
          .from('plc_data')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching PLC data:', error);
          return;
        }

        const processedData = await processPLCData(rawData);
        setPlcData(processedData);
      } catch (error) {
        console.error('Error processing PLC data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPLCData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('plc_data_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'plc_data' },
        fetchPLCData
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, devices]);

  return { plcData, loading, devices };
}
