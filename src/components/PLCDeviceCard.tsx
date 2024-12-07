import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Power, Activity } from "lucide-react";
import { useState } from "react";
import { RegisterConfigPanel } from "./RegisterConfigPanel";
import { RegisterMonitorGrid } from "./register/RegisterMonitorGrid";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

type PLCDevice = Tables<"plc_devices">;

interface PLCDeviceCardProps {
  device: PLCDevice;
}

export function PLCDeviceCard({ device }: PLCDeviceCardProps) {
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  return (
    <Card className="p-6 space-y-6 hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{device.name}</h3>
              <Badge variant={device.is_active ? "success" : "secondary"}>
                {device.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {device.description && (
              <p className="text-sm text-muted-foreground">{device.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowConfigPanel(true)}
              className="hover:bg-secondary"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Protocol</p>
            <p className="font-medium flex items-center gap-1">
              <Activity className="h-4 w-4" />
              {device.protocol === 's7' ? 'S7 (TIA Portal)' : 'Modbus TCP'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Connection</p>
            <p className="font-medium flex items-center gap-1">
              <Power className="h-4 w-4" />
              {device.ip_address}:{device.port}
            </p>
          </div>
        </div>
      </div>

      <RegisterMonitorGrid deviceId={device.id} />

      <RegisterConfigPanel
        deviceId={device.id}
        open={showConfigPanel}
        onOpenChange={setShowConfigPanel}
      />
    </Card>
  );
}