import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Terminal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useConsole } from "@/contexts/ConsoleContext";
import { InsightMetrics } from "./ai/InsightMetrics";
import { InsightMessage } from "./ai/InsightMessage";
import { useInsightCalculations } from "./ai/useInsightCalculations";
import { AIInsight } from "@/types/ai";

export function AIInsights({ deviceId }: { deviceId: string }) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [metrics, setMetrics] = useState({
    efficiency: 0,
    stability: 0,
    anomalyCount: 0
  });
  const { addMessage } = useConsole();
  const { calculateEfficiencyMetric, calculateStabilityMetric } = useInsightCalculations(insights);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        console.log('Fetching insights for device:', deviceId);
        
        const { data: deviceData, error: deviceError } = await supabase
          .from('plc_devices')
          .select('id, owner_id')
          .eq('id', deviceId)
          .single();

        if (deviceError) {
          console.error('Error checking device:', deviceError);
          return;
        }

        console.log('Device data:', deviceData);
        
        const { data, error } = await supabase
          .from('ai_insights')
          .select('*')
          .eq('device_id', deviceId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching insights:', error);
          if (error.message.includes('JWT')) {
            addMessage('error', 'Session expired. Please log in again.');
          }
          return;
        }

        console.log('Received insights data:', data);
        setInsights(data as AIInsight[]);

        const recentInsights = data as AIInsight[];
        const efficiency = calculateEfficiencyMetric(recentInsights);
        const stability = calculateStabilityMetric(recentInsights);
        const anomalyCount = recentInsights.filter(i => i.severity === 'critical').length;

        setMetrics({
          efficiency,
          stability,
          anomalyCount
        });

      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    if (deviceId) {
      fetchInsights();
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
          setInsights(current => [payload.new as AIInsight, ...current.slice(0, 4)]);
          
          if (payload.new.severity === 'critical') {
            addMessage('error', payload.new.message);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [deviceId, addMessage, calculateEfficiencyMetric, calculateStabilityMetric]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <InsightMetrics 
          efficiency={metrics.efficiency}
          stability={metrics.stability}
          anomalyCount={metrics.anomalyCount}
        />
      </div>
      
      <div className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <InsightMessage key={insight.id} {...insight} />
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No insights available yet
          </p>
        )}
      </div>
    </Card>
  );
}