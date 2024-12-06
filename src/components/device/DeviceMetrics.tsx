import { DeviceMetric } from "@/types/device";

interface DeviceMetricsProps {
  metrics: DeviceMetric[];
}

export function DeviceMetrics({ metrics }: DeviceMetricsProps) {
  return (
    <div className="space-y-3">
      {metrics.map((metric, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-sm text-system-gray-500">{metric.label}</span>
          <span className="font-medium">
            {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
            {metric.unit && <span className="text-system-gray-400 ml-1">{metric.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}