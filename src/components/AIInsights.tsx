import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useConsole } from "@/contexts/ConsoleContext";
import { useInsightCalculations } from "./ai/useInsightCalculations";
import { AIInsight } from "@/types/ai";
import { toast } from "sonner";
import { InsightsHeader } from "./ai/insights/InsightsHeader";
import { InsightsContent } from "./ai/insights/InsightsContent";
import { useAIInsightsFetching } from "@/hooks/useAIInsightsFetching";

export function AIInsights({ deviceId }: { deviceId: string }) {
  const { insights, isLoading, fetchInsights } = useAIInsightsFetching(deviceId);
  const [metrics, setMetrics] = useState({
    efficiency: 0,
    stability: 0,
    anomalyCount: 0
  });
  const { addMessage } = useConsole();
  const { calculateEfficiencyMetric, calculateStabilityMetric } = useInsightCalculations(insights);

  useEffect(() => {
    if (deviceId) {
      fetchInsights(0);
    }

    const subscription = supabase
      .channel('ai_insights_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_insights',
          filter: `device_id=eq.${deviceId}`
        },
        (payload) => {
          console.log('New insight received:', payload);
          const newInsight = payload.new as AIInsight;
          setInsights(current => [newInsight, ...current.slice(0, 4)]);
          
          if (newInsight.severity === 'critical') {
            addMessage('error', newInsight.message);
            toast.error(newInsight.message);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [deviceId, addMessage, fetchInsights]);

  useEffect(() => {
    const efficiency = calculateEfficiencyMetric(insights);
    const stability = calculateStabilityMetric(insights);
    const anomalyCount = insights.filter(i => i.severity === 'critical').length;

    setMetrics({
      efficiency,
      stability,
      anomalyCount
    });
  }, [insights, calculateEfficiencyMetric, calculateStabilityMetric]);

  if (!deviceId) {
    return (
      <Card className="p-4">
        <p className="text-center text-gray-500">No device selected</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <InsightsHeader
        isLoading={isLoading}
        onRefresh={() => fetchInsights(0)}
        metrics={metrics}
      />
      <InsightsContent 
        insights={insights}
        isLoading={isLoading}
      />
    </Card>
  );
}