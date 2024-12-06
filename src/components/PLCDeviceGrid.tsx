import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PLCDeviceCard } from "./PLCDeviceCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { NewPLCDeviceDialog } from "./NewPLCDeviceDialog";

export const PLCDeviceGrid = () => {
  const [showNewDevice, setShowNewDevice] = useState(false);

  const { data: devices, isLoading } = useQuery({
    queryKey: ["plc-devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plc_devices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching PLC devices:", error);
        throw error;
      }

      return data;
    },
  });

  if (isLoading) {
    return <div>Loading devices...</div>;
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