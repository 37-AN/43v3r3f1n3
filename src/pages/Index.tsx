import { ConnectionStatusBanner } from "@/components/ConnectionStatusBanner";
import { SimulationDashboard } from "@/features/simulation/components/SimulationDashboard";
import { useOPCUAClients } from "@/hooks/useOPCUAClients";
import { usePLCData } from "@/hooks/usePLCData";
import { useSession } from "@/hooks/useSession";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const { session, loading: sessionLoading } = useSession();
  const { simulatedData } = useOPCUAClients();
  const { plcData } = usePLCData(!!session);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFirstDevice = async () => {
      try {
        if (!session?.user?.id) {
          console.log("No authenticated user");
          return;
        }

        console.log("Fetching first available PLC device for user");
        const { data: devices, error } = await supabase
          .from('plc_devices')
          .select('id')
          .eq('owner_id', session.user.id)
          .limit(1)
          .single();

        if (error) {
          console.error("Error fetching PLC device:", error);
          if (error.message.includes('JWT')) {
            toast.error("Session expired. Please log in again.");
          } else {
            toast.error("Error loading device data");
          }
          return;
        }

        if (devices) {
          console.log("Found device:", devices.id);
          setSelectedDeviceId(devices.id);
        } else {
          console.log("No devices found for user");
          toast.info("No devices found. Please add a device first.");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("Failed to load device data");
      }
    };

    if (session && !selectedDeviceId) {
      fetchFirstDevice();
    }
  }, [session, selectedDeviceId]);

  if (sessionLoading) {
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
      {selectedDeviceId ? (
        <SimulationDashboard 
          deviceId={selectedDeviceId}
          simulatedData={simulatedData}
        />
      ) : (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">No Device Selected</h2>
          <p className="text-gray-600">Please add a PLC device to get started.</p>
        </div>
      )}
    </div>
  );
}