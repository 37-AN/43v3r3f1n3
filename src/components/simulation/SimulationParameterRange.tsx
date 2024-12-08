import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SimulationParameterRangeProps {
  parameterKey: string;
  value: { min: number; max: number };
  onChange: (key: string, min: number, max: number) => void;
}

export function SimulationParameterRange({ parameterKey, value, onChange }: SimulationParameterRangeProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs capitalize">{parameterKey.replace('_', ' ')}</Label>
      <div className="flex gap-1">
        <Input
          type="number"
          value={value.min}
          onChange={(e) => onChange(parameterKey, parseFloat(e.target.value), value.max)}
          placeholder="Min"
          className="h-7 text-xs"
        />
        <Input
          type="number"
          value={value.max}
          onChange={(e) => onChange(parameterKey, value.min, parseFloat(e.target.value))}
          placeholder="Max"
          className="h-7 text-xs"
        />
      </div>
    </div>
  );
}