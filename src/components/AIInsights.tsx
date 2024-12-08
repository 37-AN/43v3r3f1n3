import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info, Activity, Zap, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useConsole } from "@/contexts/ConsoleContext";

interface AIInsight {
  id: string;
  device_id: string;
  insight_type: string;
  message: string;
  confidence: number;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
  metadata: Record<string, any>;
}

export function AIInsights({ deviceId }: { deviceId: string }) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [metrics, setMetrics] = useState({
    efficiency: 0,
    stability: 0,
    anomalyCount: 0
  });
  const { addMessage } = useConsole();

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

        // Calculate aggregated metrics
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

    // Subscribe to real-time updates
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
          
          // Only show critical insights in console
          if (payload.new.severity === 'critical') {
            addMessage('error', payload.new.message);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [deviceId, addMessage]);

  const getSeverityIcon = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const calculateEfficiencyMetric = (insights: AIInsight[]): number => {
    const efficiencyInsights = insights.filter(i => 
      i.metadata?.type === 'efficiency' || i.insight_type === 'performance'
    );
    if (efficiencyInsights.length === 0) return 85; // Default value
    return efficiencyInsights.reduce((acc, i) => acc + (i.metadata?.efficiency || 0), 0) / efficiencyInsights.length;
  };

  const calculateStabilityMetric = (insights: AIInsight[]): number => {
    const stabilityInsights = insights.filter(i => 
      i.metadata?.type === 'stability' || i.insight_type === 'system_health'
    );
    if (stabilityInsights.length === 0) return 90; // Default value
    return stabilityInsights.reduce((acc, i) => acc + (i.metadata?.stability || 0), 0) / stabilityInsights.length;
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm">Efficiency: {metrics.efficiency.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-sm">Stability: {metrics.stability.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-sm">Anomalies: {metrics.anomalyCount}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              {getSeverityIcon(insight.severity)}
              <div>
                <p className="text-sm font-medium">{insight.message}</p>
                <div className="flex gap-4 mt-1">
                  <p className="text-xs text-gray-500">
                    Confidence: {(insight.confidence * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(insight.created_at).toLocaleTimeString()}
                  </p>
                  {insight.metadata?.type && (
                    <p className="text-xs text-gray-500 capitalize">
                      Type: {insight.metadata.type}
                    </p>
                  )}
                </div>
              </div>
            </div>
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
