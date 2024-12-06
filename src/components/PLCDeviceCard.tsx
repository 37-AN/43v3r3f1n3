import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";
import { useState } from "react";
import { RegisterConfigPanel } from "./RegisterConfigPanel";
import { RegisterMonitorGrid } from "./register/RegisterMonitorGrid";

interface PLCDeviceCardProps {
  id: string;
  name: string;
  description?: string;
}

export function PLCDeviceCard({ id, name, description }: PLCDeviceCardProps) {
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
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

      <RegisterMonitorGrid deviceId={id} />

      <RegisterConfigPanel
        deviceId={id}
        open={showConfigPanel}
        onOpenChange={setShowConfigPanel}
      />
    </Card>
  );
}