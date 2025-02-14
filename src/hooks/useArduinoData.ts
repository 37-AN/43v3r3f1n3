
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConsole } from "@/contexts/ConsoleContext";
import { ArduinoPLCData } from "@/types/arduino";
import { toast } from "sonner";

export function useArduinoData() {
  const { addMessage } = useConsole();

  return useQuery({
    queryKey: ["arduino-plc-data"],
    queryFn: async () => {
      console.log("Fetching Arduino PLC data...");
      try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (24 * 60 * 60 * 1000));

        const { data, error } = await supabase
          .from("arduino_plc_data")
          .select("*, plc_devices(name)")
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString())
          .order("timestamp", { ascending: true });

        if (error) {
          console.error("Error fetching Arduino PLC data:", error);
          addMessage('error', `Error: ${error.message}`);
          toast.error("Failed to fetch PLC data. Please try again.");
          throw error;
        }

        console.log("Successfully fetched Arduino PLC data:", data);
        
        if (!data || data.length === 0) {
          console.log("No PLC data found in the selected time range");
          addMessage('info', 'No PLC data found in the selected time range');
        }
        
        return data as ArduinoPLCData[];
      } catch (error) {
        console.error("Error in data fetch:", error);
        if (error instanceof Error) {
          toast.error(error.message);
        }
        throw error;
      }
    },
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
