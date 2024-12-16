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
      console.log("Starting Arduino PLC data fetch...");
      
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error("Authentication error:", authError);
          addMessage('error', 'Authentication error. Please try logging in again.');
          throw authError;
        }

        if (!session) {
          console.log("No active session found");
          addMessage('error', 'Please log in to view PLC data');
          throw new Error("Authentication required");
        }

        console.log("Authenticated user:", session.user.email);

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (24 * 60 * 60 * 1000));

        const { data, error } = await supabase
          .from("arduino_plc_data")
          .select("*, plc_devices(name)")
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString())
          .order("timestamp", { ascending: true });

        if (error) {
          console.error("Error fetching PLC data:", error);
          throw error;
        }

        console.log("Successfully fetched Arduino PLC data:", data?.length, "records");
        
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