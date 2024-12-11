import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useConsole } from "@/contexts/ConsoleContext";
import { useInsightCalculations } from "./ai/useInsightCalculations";
import { toast } from "sonner";
import { InsightsHeader } from "./ai/insights/InsightsHeader";
import { InsightsContent } from "./ai/insights/InsightsContent";
import { useAIInsightsFetching } from "@/hooks/useAIInsightsFetching";

export function AIInsights({ deviceId }: { deviceId: string }) {
  const { insights, isLoading, fetchInsights } = useAIInsightsFetching(deviceId);
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
          fetchInsights(0); // Refresh insights when new data arrives
          
          if (payload.new.severity === 'critical') {
            addMessage('error', payload.new.message);
            toast.error(payload.new.message);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [deviceId, addMessage, fetchInsights]);

  const metrics = {
    efficiency: calculateEfficiencyMetric(insights),
    stability: calculateStabilityMetric(insights),
    anomalyCount: insights.filter(i => i.severity === 'critical').length
  };

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