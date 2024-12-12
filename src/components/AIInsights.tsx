import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useConsole } from "@/contexts/ConsoleContext";
import { useInsightCalculations } from "./ai/useInsightCalculations";
import { toast } from "sonner";
import { InsightsHeader } from "./ai/insights/InsightsHeader";
import { InsightsContent } from "./ai/insights/InsightsContent";
import { useQuery } from "@tanstack/react-query";
import { AIInsight } from "@/types/ai";

export function AIInsights({ deviceId }: { deviceId: string }) {
  const { addMessage } = useConsole();
  
  const fetchInsights = async () => {
    console.log('Fetching insights for device:', deviceId);
    if (!deviceId) return [];
    
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to fetch insights');
      addMessage('error', `Failed to fetch insights: ${error.message}`);
      throw error;
    }

    // Validate and transform the severity field
    const validatedData = (data || []).map(insight => {
      // Ensure severity is one of the allowed values, default to 'info' if invalid
      const severity = ['info', 'warning', 'critical'].includes(insight.severity) 
        ? insight.severity as AIInsight['severity']
        : 'info';
      
      return {
        ...insight,
        severity
      } as AIInsight;
    });

    console.log('Received insights:', validatedData);
    return validatedData;
  };

  const { data: insights = [], isLoading, refetch } = useQuery({
    queryKey: ['ai-insights', deviceId],
    queryFn: fetchInsights,
    enabled: !!deviceId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { calculateEfficiencyMetric, calculateStabilityMetric } = useInsightCalculations(insights);

  useEffect(() => {
    if (!deviceId) return;

    console.log('Setting up real-time subscription for device:', deviceId);
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
          refetch();
          
          if (payload.new.severity === 'critical') {
            addMessage('error', payload.new.message);
            toast.error(payload.new.message);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up AI insights subscription');
      subscription.unsubscribe();
    };
  }, [deviceId, addMessage, refetch]);

  const metrics = {
    efficiency: calculateEfficiencyMetric(insights),
    stability: calculateStabilityMetric(insights),
    anomalyCount: insights.filter(i => i.severity === 'critical').length
  };

  return (
    <Card className="p-4 space-y-4">
      {!deviceId ? (
        <p className="text-center text-gray-500">No device selected</p>
      ) : (
        <>
          <InsightsHeader
            isLoading={isLoading}
            onRefresh={() => {
              console.log('Manual refresh triggered');
              refetch();
            }}
            metrics={metrics}
          />
          <InsightsContent 
            insights={insights}
            isLoading={isLoading}
          />
        </>
      )}
    </Card>
  );
}