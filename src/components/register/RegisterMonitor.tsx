import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus } from "lucide-react";
import { useDeviceUpdates } from "@/hooks/useDeviceUpdates";

interface RegisterMonitorProps {
  deviceId: string;
  registerId: string;
  address: number;
  registerType: string;
  currentValue: number;
}

export function RegisterMonitor({
  deviceId,
  registerId,
  address,
  registerType,
  currentValue,
}: RegisterMonitorProps) {
  const [value, setValue] = useState(currentValue);
  const { updateRegisterValue } = useDeviceUpdates();

  const handleIncrement = () => {
    const newValue = value + 1;
    setValue(newValue);
    updateRegisterValue(deviceId, address, newValue);
  };

  const handleDecrement = () => {
    const newValue = value - 1;
    setValue(newValue);
    updateRegisterValue(deviceId, address, newValue);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">
            Register {address} ({registerType})
          </h4>
          <span className="text-sm font-medium">{value}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleDecrement}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleIncrement}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}