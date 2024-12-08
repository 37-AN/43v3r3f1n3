import { Activity, Zap, TrendingUp } from "lucide-react";

interface MetricsProps {
  efficiency: number;
  stability: number;
  anomalyCount: number;
}

export function InsightMetrics({ efficiency, stability, anomalyCount }: MetricsProps) {
  return (
    <div className="flex gap-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-green-500" />
        <span className="text-sm">Efficiency: {efficiency.toFixed(1)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-blue-500" />
        <span className="text-sm">Stability: {stability.toFixed(1)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-purple-500" />
        <span className="text-sm">Anomalies: {anomalyCount}</span>
      </div>
    </div>
  );
}