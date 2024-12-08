import { Card } from "@/components/ui/card";
import { useInsightsFetching } from './insights/useInsightsFetching';
import { InsightsDisplay } from './insights/InsightsDisplay';
import { InsightsMetricsContainer } from './insights/InsightsMetricsContainer';

export function AIInsights({ deviceId }: { deviceId: string }) {
  const { insights } = useInsightsFetching(deviceId);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <InsightsMetricsContainer insights={insights} />
      </div>
      
      <InsightsDisplay insights={insights} />
    </Card>
  );
}