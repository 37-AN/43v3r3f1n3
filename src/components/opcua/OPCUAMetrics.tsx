import { Card } from "@/components/ui/card";
import { MetricsChart } from "@/components/MetricsChart";
import { ModbusRegisterData } from "@/types/modbus";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface OPCUAMetricsProps {
  simulatedData: Record<string, number>;
  connectionStatus: Record<string, boolean>;
}

export function OPCUAMetrics({ simulatedData, connectionStatus }: OPCUAMetricsProps) {
  // Convert simulatedData to chart format
  const getChartData = (key: string): ModbusRegisterData[] => {
    return [{
      timestamp: new Date().toLocaleTimeString(),
      value: simulatedData[key] || 0,
      registerType: 'input',
      address: 1
    }];
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">OPC UA Metrics</h2>
        <div className="flex gap-2">
          {Object.entries(connectionStatus).map(([server, status]) => (
            <Badge 
              key={server}
              variant={status ? "default" : "destructive"}
              className="capitalize"
            >
              {server}: {status ? 'Connected' : 'Disconnected'}
            </Badge>
          ))}
        </div>
      </div>

      {Object.values(connectionStatus).every(status => !status) && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Not connected to any OPC UA server. Please check your connection settings.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(simulatedData).map(([key, value]) => (
          <Card key={key} className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold capitalize">{key}</h3>
              <p className="text-2xl font-bold">{typeof value === 'number' ? value.toFixed(2) : 'N/A'}</p>
            </div>
            <div className="h-[200px]">
              <MetricsChart
                title={`${key} History`}
                data={getChartData(key)}
                registerType="input"
                className="h-full"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}