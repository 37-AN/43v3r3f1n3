import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConnectionStatusProps {
  connectionStatus: { [key: string]: boolean };
}

export const ConnectionStatus = ({ connectionStatus }: ConnectionStatusProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
      <div className="space-y-3">
        {Object.entries(connectionStatus).map(([deviceId, status]) => (
          <div key={deviceId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Device ({deviceId})</span>
            <Badge variant={status ? "success" : "destructive"} className="capitalize">
              {status ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};