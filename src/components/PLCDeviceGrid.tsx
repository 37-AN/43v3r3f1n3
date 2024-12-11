import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PLCDeviceCard } from "./PLCDeviceCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { NewPLCDeviceDialog } from "./NewPLCDeviceDialog";
import { toast } from "sonner";

export const PLCDeviceGrid = () => {
  const [showNewDevice, setShowNewDevice] = useState(false);

  const { data: devices, isLoading, error } = useQuery({
    queryKey: ["plc-devices"],
    queryFn: async () => {
      console.log("Fetching PLC devices...");
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error("Authentication error:", authError);
          toast.error("Authentication error. Please try logging in again.");
          throw authError;
        }

        if (!user) {
          console.log("No user found");
          toast.error("Please log in to view devices");
          return [];
        }

        console.log("Authenticated user:", user.id);

        const { data, error } = await supabase
          .from("plc_devices")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching PLC devices:", error);
          if (error.message.includes('Failed to fetch')) {
            toast.error("Connection error. Please check your internet connection.");
          } else if (error.message.includes('JWT')) {
            toast.error("Session expired. Please log in again.");
          } else {
            toast.error("Failed to load devices. Please try again.");
          }
          throw error;
        }

        console.log("Successfully fetched PLC devices:", data);
        return data;
      } catch (error) {
        console.error("Error in PLC devices fetch:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Failed to load devices</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4">Loading devices...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">PLC Devices</h2>
        <Button
          onClick={() => setShowNewDevice(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Device
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices?.map((device) => (
          <PLCDeviceCard key={device.id} device={device} />
        ))}
      </div>
      <NewPLCDeviceDialog open={showNewDevice} onOpenChange={setShowNewDevice} />
    </div>
  );
};