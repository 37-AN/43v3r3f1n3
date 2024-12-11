import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { InsightMetrics } from "../InsightMetrics";

interface InsightsHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  metrics: {
    efficiency: number;
    stability: number;
    anomalyCount: number;
  };
}

export function InsightsHeader({ isLoading, onRefresh, metrics }: InsightsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">AI Insights</h3>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
        <InsightMetrics 
          efficiency={metrics.efficiency}
          stability={metrics.stability}
          anomalyCount={metrics.anomalyCount}
        />
      </div>
    </div>
  );
}