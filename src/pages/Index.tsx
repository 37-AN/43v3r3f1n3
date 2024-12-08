import { ConnectionStatusBanner } from "@/components/ConnectionStatusBanner";
import { SimulationDashboard } from "@/features/simulation/components/SimulationDashboard";
import { useOPCUAClients } from "@/hooks/useOPCUAClients";
import { usePLCData } from "@/hooks/usePLCData";
import { useSession } from "@/hooks/useSession";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const { session, loading } = useSession();
  const { simulatedData } = useOPCUAClients();
  const { plcData } = usePLCData(!!session);

  const selectedDeviceId = "e2fae487-1ee2-4ea2-b87f-decedb7d12a5";

  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("Checking Supabase connection...");
        const { data, error } = await supabase
          .from('plc_devices')
          .select('id, owner_id')
          .eq('id', selectedDeviceId)
          .single();

        if (error) {
          console.error("Supabase connection error:", error);
          if (error.message.includes('JWT')) {
            toast.error("Authentication error. Please log in again.");
          } else {
            toast.error("Error connecting to server. Please try again later.");
          }
          return;
        }

        console.log("Successfully connected to Supabase. Device data:", data);
      } catch (error) {
        console.error("Unexpected error checking connection:", error);
        toast.error("Failed to connect to server. Please check your connection.");
      }
    };

    if (session) {
      checkConnection();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-4">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to view this content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <ConnectionStatusBanner />
      <SimulationDashboard 
        deviceId={selectedDeviceId}
        simulatedData={simulatedData}
      />
    </div>
  );
}