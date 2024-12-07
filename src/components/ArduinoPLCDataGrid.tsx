import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MetricsChart } from "@/components/MetricsChart";
import { useDataProcessing } from "@/hooks/useDataProcessing";
import { ModbusRegisterData } from "@/types/modbus";

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
  const { data: arduinoData, isLoading } = useQuery({
    queryKey: ["arduino-plc-data"],
    queryFn: async () => {
      console.log("Fetching Arduino PLC data...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user found");
        return [];
      }

      const { data, error } = await supabase
        .from("arduino_plc_data")
        .select("*, plc_devices(name)")
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("Error fetching Arduino PLC data:", error);
        throw error;
      }

      console.log("Fetched Arduino PLC data:", data);
      return data as ArduinoPLCData[];
    },
    refetchInterval: 5000 // Refresh every 5 seconds
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
      address: parseInt(item.data_type.split('_').pop() || '0', 10) // Use data_type as basis for address
    });
    return acc;
  }, {} as Record<string, ModbusRegisterData[]>) ?? {};

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
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