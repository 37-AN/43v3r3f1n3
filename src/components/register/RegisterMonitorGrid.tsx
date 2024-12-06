import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RegisterMonitor } from "./RegisterMonitor";

interface RegisterMonitorGridProps {
  deviceId: string;
}

export function RegisterMonitorGrid({ deviceId }: RegisterMonitorGridProps) {
  const { data: registers, isLoading } = useQuery({
    queryKey: ["plc-registers", deviceId],
    queryFn: async () => {
      if (!deviceId) {
        console.log("No device ID provided");
        return [];
      }

      console.log("Fetching registers for device:", deviceId);
      const { data, error } = await supabase
        .from("plc_registers")
        .select("*")
        .eq("plc_id", deviceId);

      if (error) {
        console.error("Error fetching registers:", error);
        throw error;
      }

      console.log("Fetched registers:", data);
      return data;
    },
    enabled: !!deviceId, // Only run query if deviceId exists
  });

  if (!deviceId) {
    return <div>No device selected</div>;
  }

  if (isLoading) {
    return <div>Loading registers...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {registers?.map((register) => (
        <RegisterMonitor
          key={register.id}
          deviceId={deviceId}
          registerId={register.id}
          address={register.address}
          registerType={register.register_type}
          currentValue={register.initial_value || 0}
        />
      ))}
    </div>
  );
}