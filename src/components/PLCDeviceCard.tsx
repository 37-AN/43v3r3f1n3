import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Server } from "lucide-react";
import { useState } from "react";
import { RegisterConfigPanel } from "./RegisterConfigPanel";

interface PLCDeviceCardProps {
  device: {
    id: string;
    name: string;
    description?: string;
    ip_address?: string;
    port?: number;
    slave_id?: number;
    is_active: boolean;
  };
}

export const PLCDeviceCard = ({ device }: PLCDeviceCardProps) => {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              {device.name}
            </div>
          </CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowConfig(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {device.description && (
              <p className="text-muted-foreground">{device.description}</p>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>IP Address:</span>
              <span>{device.ip_address || "Not set"}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Port:</span>
              <span>{device.port || 502}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Slave ID:</span>
              <span>{device.slave_id || 1}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={`font-medium ${
                  device.is_active ? "text-system-mint" : "text-system-red"
                }`}
              >
                {device.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <RegisterConfigPanel
        deviceId={device.id}
        open={showConfig}
        onOpenChange={setShowConfig}
      />
    </>
  );
};