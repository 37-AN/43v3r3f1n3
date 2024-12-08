import { formatXAxis } from "@/utils/chart/formatters";

interface ChartHeaderProps {
  title: string;
  registerType: string;
  lastTimestamp?: string;
}

export function ChartHeader({ title, registerType, lastTimestamp }: ChartHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div>
        <h3 className="text-lg font-semibold text-system-gray-900 dark:text-system-gray-100">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          Register Type: {registerType.charAt(0).toUpperCase() + registerType.slice(1)}
        </p>
      </div>
      <div className="text-xs text-muted-foreground">
        Last updated: {lastTimestamp ? formatXAxis(lastTimestamp) : 'N/A'}
      </div>
    </div>
  );
}