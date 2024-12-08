import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { ConnectionStatusBadges } from "./ConnectionStatusBadges";
import { OPCUAMetricCard } from "./OPCUAMetricCard";
import { ModbusRegisterData } from "@/types/modbus";
import { Card } from "@/components/ui/card";

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
  const hasPartialConnection = Object.values(connectionStatus).some(status => !status);

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">OPC UA Connection Status</h2>
          <ConnectionStatusBadges connectionStatus={connectionStatus} />
          
          {isDisconnected && (
            <Alert variant="destructive">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Not connected to any OPC UA server. Please check your connection settings.
              </AlertDescription>
            </Alert>
          )}
          
          {hasPartialConnection && !isDisconnected && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Some OPC UA connections are not established. Check individual server status above.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

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