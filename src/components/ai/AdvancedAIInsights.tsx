import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useConsole } from "@/contexts/ConsoleContext";
import { toast } from "sonner";
import { AIInsight } from "@/types/ai";
import { InsightMessage } from "./InsightMessage";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw } from "lucide-react";

interface AdvancedAIInsightsProps {
  deviceId: string;
  metrics: Record<string, number>;
}

export function AdvancedAIInsights({ deviceId, metrics }: AdvancedAIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { addMessage } = useConsole();

  const fetchInsights = async () => {
    try {
      console.log('Fetching advanced insights for device:', deviceId);
      
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('device_id', deviceId)
        .eq('insight_type', 'advanced_analysis')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching insights:', error);
        toast.error('Failed to fetch AI insights');
        return;
      }

      setInsights(data as AIInsight[]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load insights');
    }
  };

  const generateNewInsight = async () => {
    setIsAnalyzing(true);
    try {
      const timeRange = '24h'; // Can be made configurable
      
      console.log('Generating new insight with metrics:', metrics);
      const { data, error } = await supabase.functions.invoke('industrial-ai-insights', {
        body: { 
          deviceId,
          metrics,
          timeRange
        }
      });

      if (error) {
        console.error('Error generating insight:', error);
        throw error;
      }

      console.log('Generated new AI insight:', data);
      toast.success('New AI insight generated');
      fetchInsights();
    } catch (error) {
      console.error('Error generating insight:', error);
      toast.error('Failed to generate new insight');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!deviceId) return;
    
    fetchInsights();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`ai_insights_${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_insights',
          filter: `device_id=eq.${deviceId} AND insight_type=eq.advanced_analysis`
        },
        (payload) => {
          console.log('New advanced insight received:', payload);
          setInsights(current => [payload.new as AIInsight, ...current.slice(0, 4)]);
          
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
  }, [deviceId, addMessage]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Advanced AI Insights</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={generateNewInsight}
          disabled={isAnalyzing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Generate New Insight'}
        </Button>
      </div>
      
      <div className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <InsightMessage key={insight.id} {...insight} />
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No advanced insights available yet
          </p>
        )}
      </div>
    </Card>
  );
}