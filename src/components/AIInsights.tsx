import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Terminal, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useConsole } from "@/contexts/ConsoleContext";
import { InsightMetrics } from "./ai/InsightMetrics";
import { InsightMessage } from "./ai/InsightMessage";
import { useInsightCalculations } from "./ai/useInsightCalculations";
import { AIInsight } from "@/types/ai";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AIInsights({ deviceId }: { deviceId: string }) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [metrics, setMetrics] = useState({
    efficiency: 0,
    stability: 0,
    anomalyCount: 0
  });
  const { addMessage } = useConsole();
  const { calculateEfficiencyMetric, calculateStabilityMetric } = useInsightCalculations(insights);
  const MAX_RETRIES = 3;

  const fetchInsights = async (attempt = 0) => {
    try {
      if (!deviceId) {
        console.log('No device ID provided');
        return;
      }

      setIsLoading(true);
      console.log(`Attempt ${attempt + 1}: Fetching insights for device:`, deviceId);
      
      // First verify device exists and user has access
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        console.error('No active session');
        toast.error('Please log in to view insights');
        addMessage('error', 'Authentication required');
        return;
      }

      // Add exponential backoff delay for retries
      if (attempt > 0) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${backoffDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }

      const { data: deviceData, error: deviceError } = await supabase
        .from('plc_devices')
        .select('id, owner_id')
        .eq('id', deviceId)
        .single();

      if (deviceError) {
        console.error('Error checking device:', deviceError);
        if (deviceError.message.includes('JWT')) {
          toast.error('Session expired. Please log in again.');
          addMessage('error', 'Session expired. Please log in again.');
        } else {
          toast.error('Error checking device access');
          addMessage('error', `Error checking device: ${deviceError.message}`);
        }
        throw deviceError;
      }

      if (!deviceData) {
        console.error('Device not found or no access');
        toast.error('Device not found or no access');
        addMessage('error', 'Device not found or no access');
        return;
      }

      console.log('Device data:', deviceData);
      console.log('Fetching insights with auth token');
      
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
          toast.error('Session expired. Please log in again.');
        } else {
          toast.error('Failed to fetch insights');
          addMessage('error', `Failed to fetch insights: ${error.message}`);
        }
        throw error;
      }

      console.log('Received insights data:', data);
      setInsights(data as AIInsight[]);
      setRetryCount(0);

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
      console.error('Error in fetchInsights:', error);
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying... Attempt ${attempt + 1} of ${MAX_RETRIES}`);
        setRetryCount(attempt + 1);
        return fetchInsights(attempt + 1);
      }
      toast.error('Failed to load insights. Please try again.');
      addMessage('error', `Failed to load insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!deviceId) {
    return (
      <Card className="p-4">
        <p className="text-center text-gray-500">No device selected</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchInsights(0)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <InsightMetrics 
            efficiency={metrics.efficiency}
            stability={metrics.stability}
            anomalyCount={metrics.anomalyCount}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <InsightMessage key={insight.id} {...insight} />
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            {isLoading ? 'Loading insights...' : 'No insights available yet'}
          </p>
        )}
      </div>
    </Card>
  );
}