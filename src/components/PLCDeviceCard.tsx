import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useState } from "react";
import { RegisterConfigPanel } from "./RegisterConfigPanel";
import { RegisterMonitorGrid } from "./register/RegisterMonitorGrid";
import { Tables } from "@/integrations/supabase/types";

type PLCDevice = Tables<"plc_devices">;

interface PLCDeviceCardProps {
  device: PLCDevice;
}

export function PLCDeviceCard({ device }: PLCDeviceCardProps) {
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{device.name}</h3>
          {device.description && (
            <p className="text-sm text-muted-foreground">{device.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowConfigPanel(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
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