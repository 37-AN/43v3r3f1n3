import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MetricsChart } from "@/components/MetricsChart";
import { ModbusRegisterData } from "@/types/modbus";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ArduinoPLCData {
  id: string;
  device_id: string;
  data_type: string;
  value: number;
  timestamp: string;
  plc_devices: {
    name: string;
  } | null;
}

export function ArduinoPLCDataGrid() {
  const { data: arduinoData, isLoading, error } = useQuery({
    queryKey: ["arduino-plc-data"],
    queryFn: async () => {
      console.log("Fetching Arduino PLC data...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user found");
        throw new Error("Authentication required");
      }

      console.log("Authenticated user:", user.email);

      // Get the current timestamp and timestamp from 24 hours ago
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (24 * 60 * 60 * 1000));

      try {
        const { data, error } = await supabase
          .from("arduino_plc_data")
          .select("*, plc_devices(name)")
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString())
          .order("timestamp", { ascending: true });

        if (error) {
          console.error("Error fetching Arduino PLC data:", error);
          toast.error("Failed to fetch PLC data");
          throw error;
        }

        console.log("Successfully fetched Arduino PLC data:", data);
        
        if (!data || data.length === 0) {
          console.log("No PLC data found in the selected time range");
        }
        
        return data as ArduinoPLCData[];
      } catch (error) {
        console.error("Network or server error:", error);
        toast.error("Network error while fetching PLC data");
        throw error;
      }
    },
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const groupedData = arduinoData?.reduce((acc, item) => {
    const key = `${item.device_id}-${item.data_type}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push({
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
      value: item.value,
      registerType: 'input' as const,
      address: parseInt(item.data_type.split('_').pop() || '0', 10)
    });
    return acc;
  }, {} as Record<string, ModbusRegisterData[]>) ?? {};

  if (error) {
    console.error("Error in ArduinoPLCDataGrid:", error);
    return (
      <Card className="p-6">
        <div className="text-red-500">
          Failed to load PLC data. Please check your connection and try again.
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading PLC data...</span>
        </div>
      </Card>
    );
  }

  if (!arduinoData?.length) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>No PLC data available for the last 24 hours.</p>
          <p className="text-sm mt-2">Please check your device connections or wait for new data to be recorded.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Arduino PLC Data</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedData).map(([key, data]) => {
          const [deviceId, dataType] = key.split('-');
          const deviceData = arduinoData?.find(item => item.device_id === deviceId);
          const deviceName = deviceData?.plc_devices?.name || 'Unknown Device';
          
          return (
            <MetricsChart
              key={key}
              title={`${deviceName} - ${dataType}`}
              data={data}
              registerType="input"
              className="transition-transform hover:scale-[1.01]"
            />
          );
        })}
      </div>
    </div>
  );
}