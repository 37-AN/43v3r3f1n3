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
    if (!deviceId) {
      console.log('No device ID provided for fetching insights');
      return;
    }

    try {
      console.log('Fetching advanced insights for device:', deviceId);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('No active session');
        toast.error('Please log in to view insights');
        return;
      }

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

      console.log('Received insights:', data);
      setInsights(data as AIInsight[]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load insights');
    }
  };

  const generateNewInsight = async () => {
    if (!deviceId || !metrics) {
      console.error('Missing required data for insight generation');
      toast.error('Missing required data for analysis');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('Generating new insight with metrics:', metrics);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('No active session');
        toast.error('Please log in to generate insights');
        return;
      }

      const { data, error } = await supabase.functions.invoke('industrial-ai-insights', {
        body: { 
          deviceId,
          metrics,
          timeRange: '24h'
        }
      });

      if (error) {
        console.error('Error generating insight:', error);
        toast.error('Failed to generate insight');
        return;
      }

      console.log('Generated new AI insight:', data);
      
      if (data?.analysis) {
        toast.success('New AI insight generated');
        await fetchInsights();
      } else {
        console.error('No analysis received from AI function');
        toast.error('Failed to generate meaningful insight');
      }
    } catch (error) {
      console.error('Error generating insight:', error);
      toast.error('Failed to generate new insight');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!deviceId) {
      console.log('No device ID available for insights');
      return;
    }
    
    console.log('Initial insights fetch for device:', deviceId);
    fetchInsights();

    // Subscribe to real-time updates
    const channel = supabase
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
      console.log('Cleaning up insights subscription');
      channel.unsubscribe();
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
          disabled={isAnalyzing || !deviceId}
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