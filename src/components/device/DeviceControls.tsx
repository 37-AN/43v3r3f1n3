import { Button } from "@/components/ui/button";
import { PlayCircle, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceControlsProps {
  status: "active" | "warning" | "error";
  isSimulating: boolean;
  isLoading: boolean;
  onToggleSimulation: () => void;
}

export function DeviceControls({ 
  status, 
  isSimulating, 
  isLoading, 
  onToggleSimulation 
}: DeviceControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-3 h-3 rounded-full",
        status === "active" ? "bg-green-500" : 
        status === "warning" ? "bg-yellow-500" : 
        "bg-red-500"
      )} />
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleSimulation}
        disabled={isLoading}
        className={cn(
          "transition-colors",
          isSimulating ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"
        )}
      >
        {isSimulating ? (
          <StopCircle className="h-4 w-4 mr-1" />
        ) : (
          <PlayCircle className="h-4 w-4 mr-1" />
        )}
        {isSimulating ? 'Stop' : 'Simulate'}
      </Button>
    </div>
  );
}