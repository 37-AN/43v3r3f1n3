import { useArduinoData } from "./arduino/useArduinoData";
import { DataGridContent } from "./arduino/DataGridContent";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ArduinoPLCDataGrid() {
  const { data: arduinoData, isLoading, error } = useArduinoData();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error checking auth session:", error);
        toast.error("Error checking authentication status");
        return;
      }
      if (!session) {
        console.log("No active session found");
        toast.error("Please log in to view PLC data");
      }
    };
    
    checkAuth();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Arduino PLC Data</h2>
      <DataGridContent 
        isLoading={isLoading}
        error={error as Error | null}
        arduinoData={arduinoData}
      />
    </div>
  );
}