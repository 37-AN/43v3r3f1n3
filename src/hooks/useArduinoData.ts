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
        // First check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error("Authentication error:", authError);
          addMessage('error', 'Authentication error. Please try logging in again.');
          toast.error("Authentication error. Please try logging in again.");
          throw authError;
        }

        if (!user) {
          console.log("No authenticated user found");
          addMessage('error', 'Please log in to view PLC data');
          toast.error("Please log in to view PLC data");
          throw new Error("Authentication required");
        }

        console.log("Authenticated user:", user.email);
        console.log("Attempting to fetch PLC data from Supabase...");

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (24 * 60 * 60 * 1000));

        const { data, error } = await supabase
          .from("arduino_plc_data")
          .select("*, plc_devices(name)")
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString())
          .order("timestamp", { ascending: true });

        if (error) {
          console.error("Supabase query error:", error);
          
          if (error.message.includes('Failed to fetch')) {
            console.error("Network connection error - unable to reach Supabase");
            addMessage('error', 'Connection error. Please check your internet connection and try again.');
            toast.error("Unable to connect to the server. Please check your connection.");
          } else if (error.message.includes('JWT')) {
            console.error("JWT authentication error");
            addMessage('error', 'Session expired. Please log in again.');
            toast.error("Session expired. Please log in again.");
          } else {
            console.error("Unknown error:", error.message);
            addMessage('error', `Error: ${error.message}`);
            toast.error("Failed to fetch PLC data. Please try again.");
          }
          throw error;
        }

        console.log("Successfully fetched Arduino PLC data:", data?.length, "records");
        
        if (!data || data.length === 0) {
          console.log("No PLC data found in the selected time range");
          addMessage('info', 'No PLC data found in the selected time range');
          toast.info("No data available for the selected time range");
        }
        
        return data as ArduinoPLCData[];
      } catch (error) {
        console.error("Error in data fetch:", error);
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch')) {
            toast.error("Connection error. Please check your internet connection.");
          } else {
            toast.error(error.message);
          }
        }
        throw error;
      }
    },
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      errorMessage: "Failed to fetch PLC data"
    }
  });
}