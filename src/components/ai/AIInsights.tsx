import { Card } from "@/components/ui/card";
import { useInsightsFetching } from './insights/useInsightsFetching';
import { InsightsDisplay } from './insights/InsightsDisplay';
import { InsightsMetricsContainer } from './insights/InsightsMetricsContainer';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function AIInsights({ deviceId }: { deviceId: string }) {
  const { insights, isLoading, refetch } = useInsightsFetching(deviceId);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <InsightsMetricsContainer insights={insights} />
        </div>
      </div>
      
      <InsightsDisplay insights={insights} isLoading={isLoading} />
    </Card>
  );
}