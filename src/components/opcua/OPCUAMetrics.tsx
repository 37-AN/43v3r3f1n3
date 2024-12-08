import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { ConnectionStatusBadges } from "./ConnectionStatusBadges";
import { OPCUAMetricCard } from "./OPCUAMetricCard";
import { ModbusRegisterData } from "@/types/modbus";

interface OPCUAMetricsProps {
  simulatedData: Record<string, number>;
  connectionStatus: Record<string, boolean>;
}

export function OPCUAMetrics({ simulatedData, connectionStatus }: OPCUAMetricsProps) {
  const getChartData = (key: string): ModbusRegisterData[] => {
    return [{
      timestamp: new Date().toLocaleTimeString(),
      value: simulatedData[key] || 0,
      registerType: 'input',
      address: 1
    }];
  };

  const isDisconnected = Object.values(connectionStatus).every(status => !status);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">OPC UA Metrics</h2>
        <ConnectionStatusBadges connectionStatus={connectionStatus} />
      </div>

      {isDisconnected && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Not connected to any OPC UA server. Please check your connection settings.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(simulatedData).map(([key, value]) => (
          <OPCUAMetricCard
            key={key}
            title={key}
            value={value}
            chartData={getChartData(key)}
          />
        ))}
      </div>
    </div>
  );
}