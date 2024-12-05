import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DeviceCardProps {
  name: string;
  status: "active" | "warning" | "error";
  metrics: {
    label: string;
    value: string | number;
    unit?: string;
  }[];
  className?: string;
}

export function DeviceCard({ name, status, metrics, className }: DeviceCardProps) {
  return (
    <Card className={cn("p-6 animate-fade-up glass-panel", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-system-gray-900">{name}</h3>
        <div className={cn("status-indicator", status)} />
      </div>
      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-system-gray-500">{metric.label}</span>
            <span className="font-medium">
              {metric.value}
              {metric.unit && <span className="text-system-gray-400 ml-1">{metric.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}