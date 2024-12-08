import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConsole } from "@/contexts/ConsoleContext";
import { ArduinoPLCData } from "@/types/arduino";

export function useArduinoData() {
  const { addMessage } = useConsole();

  return useQuery({
    queryKey: ["arduino-plc-data"],
    queryFn: async () => {
      console.log("Fetching Arduino PLC data...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user found");
        addMessage('error', 'Authentication required');
        throw new Error("Authentication required");
      }

      console.log("Authenticated user:", user.email);

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
        if (error.message.includes('JWT') || error.message.includes('network')) {
          addMessage('error', 'Failed to fetch PLC data. Please check your connection.');
        }
        throw error;
      }

      console.log("Successfully fetched Arduino PLC data:", data);
      
      if (!data || data.length === 0) {
        console.log("No PLC data found in the selected time range");
        addMessage('info', 'No PLC data found in the selected time range');
      }
      
      return data as ArduinoPLCData[];
    },
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}