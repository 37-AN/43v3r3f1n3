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
      console.log('Initial insights fetch for device:', deviceId);
      fetchInsights();

      // Set up real-time subscription
      const subscription = supabase
        .channel(`ai_insights_${deviceId}`)
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
            // Refresh insights when new data arrives
            fetchInsights();
            
            if (payload.new.severity === 'critical') {
              addMessage('error', payload.new.message);
              toast.error(payload.new.message);
            }
          }
        )
        .subscribe();

      // Set up periodic refresh (every 30 seconds)
      const refreshInterval = setInterval(() => {
        console.log('Periodic refresh of insights');
        fetchInsights();
      }, 30000);

      return () => {
        console.log('Cleaning up AI insights subscriptions');
        subscription.unsubscribe();
        clearInterval(refreshInterval);
      };
    }
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
        onRefresh={() => {
          console.log('Manual refresh triggered');
          fetchInsights();
        }}
        metrics={metrics}
      />
      <InsightsContent 
        insights={insights}
        isLoading={isLoading}
      />
    </Card>
  );
}