import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SimulationParameterRangeProps {
  parameterKey: string;
  value: { min: number; max: number };
  onChange: (key: string, min: number, max: number) => void;
}

export function SimulationParameterRange({ parameterKey, value, onChange }: SimulationParameterRangeProps) {
  return (
    <div className="space-y-2">
      <Label className="capitalize">{parameterKey.replace('_', ' ')} Range</Label>
      <div className="flex gap-2">
        <Input
          type="number"
          value={value.min}
          onChange={(e) => onChange(parameterKey, parseFloat(e.target.value), value.max)}
          placeholder="Min"
        />
        <Input
          type="number"
          value={value.max}
          onChange={(e) => onChange(parameterKey, value.min, parseFloat(e.target.value))}
          placeholder="Max"
        />
      </div>
    </div>
  );
}