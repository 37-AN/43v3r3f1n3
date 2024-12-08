import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SimulationControlsProps {
  updateInterval: number;
  simulationType: 'normal' | 'anomaly';
  onUpdateIntervalChange: (interval: number) => void;
  onSimulationTypeChange: (type: 'normal' | 'anomaly') => void;
}

export function SimulationControls({
  updateInterval,
  simulationType,
  onUpdateIntervalChange,
  onSimulationTypeChange
}: SimulationControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <Label className="text-xs">Update Interval (ms)</Label>
        <Input
          type="number"
          value={updateInterval}
          onChange={(e) => onUpdateIntervalChange(parseInt(e.target.value))}
          min={1000}
          max={10000}
          className="h-7 text-xs"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Simulation Type</Label>
        <Select
          value={simulationType}
          onValueChange={(value: 'normal' | 'anomaly') => onSimulationTypeChange(value)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal Operation</SelectItem>
            <SelectItem value="anomaly">Anomaly Simulation</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}