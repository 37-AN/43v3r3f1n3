import { Card } from "@/components/ui/card";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatusItem } from "./status/StatusItem";

export function ConnectionStatusBanner() {
  const [refinedDataStatus, setRefinedDataStatus] = useState({
    isConnected: false,
    lastUpdate: null as Date | null
  });

  const { mesStatus } = useSystemStatus();

  useEffect(() => {
    const checkRefinedData = async () => {
      console.log("Checking refined industrial data connection...");
      try {
        const { data: engineResponse } = await supabase.functions.invoke(
          'mes-tokenization-engine',
          {
            body: { action: 'health-check' }
          }
        );

        const { data: refineryData, error } = await supabase
          .from('refined_industrial_data')
          .select('timestamp')
          .order('timestamp', { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error checking refined data:", error);
          setRefinedDataStatus(prev => ({ ...prev, isConnected: false }));
          toast.error("Failed to check data connection");
          return;
        }

        const isConnected = refineryData && refineryData.length > 0 && engineResponse?.status === 'healthy';
        const lastUpdate = isConnected ? new Date(refineryData[0].timestamp) : null;

        console.log("Refined data status:", { isConnected, lastUpdate, engineResponse });
        setRefinedDataStatus({ isConnected, lastUpdate });

        if (isConnected) {
          toast.success("Data connection verified");
        }
      } catch (err) {
        console.error("Connection check failed:", err);
        setRefinedDataStatus(prev => ({ ...prev, isConnected: false }));
        toast.error("Connection check failed");
      }
    };

    // Initial check
    checkRefinedData();

    // Set up interval for periodic checks
    const interval = setInterval(checkRefinedData, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <StatusItem 
          title="Tokenized MES Engine"
          isConnected={mesStatus.isConnected}
        />
        <StatusItem 
          title="Refined Data"
          isConnected={refinedDataStatus.isConnected}
          lastUpdate={refinedDataStatus.lastUpdate}
        />
      </div>
    </Card>
  );
}