import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { MetricsChart } from "@/components/MetricsChart";
import { ArduinoPLCData } from "@/types/arduino";
import { ModbusRegisterData } from "@/types/modbus";

interface DataGridContentProps {
  isLoading: boolean;
  error: Error | null;
  arduinoData: ArduinoPLCData[] | undefined;
}

export function DataGridContent({ isLoading, error, arduinoData }: DataGridContentProps) {
  if (error) {
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

  const groupedData = arduinoData.reduce((acc, item) => {
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
  }, {} as Record<string, ModbusRegisterData[]>);

  return (
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
  );
}