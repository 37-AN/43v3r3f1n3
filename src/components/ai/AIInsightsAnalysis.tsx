import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw } from "lucide-react";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { toast } from "sonner";
import { InsightMessage } from "./InsightMessage";
import { AIInsight } from "@/types/ai";
import { supabase } from "@/integrations/supabase/client";

interface AIInsightsAnalysisProps {
  deviceId: string;
  metrics: {
    efficiency: number;
    stability: number;
    anomalyCount: number;
  };
}

export function AIInsightsAnalysis({ deviceId, metrics }: AIInsightsAnalysisProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const { analyzeDeviceData, isAnalyzing } = useAIAnalysis();

  const fetchInsights = async () => {
    if (!deviceId) return;

    try {
      console.log('Fetching insights for device:', deviceId);
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('device_id', deviceId)
        .eq('insight_type', 'comprehensive_analysis')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching insights:', error);
        toast.error('Failed to fetch insights');
        return;
      }

      setInsights(data as AIInsight[]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load insights');
    }
  };

  const generateNewInsight = async () => {
    if (!deviceId) {
      toast.error('No device selected');
      return;
    }

    try {
      await analyzeDeviceData(
        deviceId,
        {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        metrics
      );
      
      await fetchInsights();
    } catch (error) {
      console.error('Error generating insight:', error);
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchInsights();
      
      const channel = supabase
        .channel(`ai_insights_${deviceId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ai_insights',
            filter: `device_id=eq.${deviceId} AND insight_type=eq.comprehensive_analysis`
          },
          (payload) => {
            console.log('New insight received:', payload);
            setInsights(current => [payload.new as AIInsight, ...current.slice(0, 4)]);
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [deviceId]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold">AI Analysis</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={generateNewInsight}
          disabled={isAnalyzing || !deviceId}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Generate New Analysis'}
        </Button>
      </div>
      
      <div className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <InsightMessage key={insight.id} {...insight} />
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No analysis available yet
          </p>
        )}
      </div>
    </Card>
  );
}