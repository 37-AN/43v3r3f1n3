import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  useEffect(() => {
    const fetchInsights = async () => {
      console.log('Fetching insights for device:', deviceId);
      
      // First check if the device exists and is owned by the current user
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
        toast.error('Failed to fetch AI insights');
        return;
      }

      console.log('Received insights data:', data);
      setInsights(data as AIInsight[]);
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
          
          // Show toast for critical insights
          if (payload.new.severity === 'critical') {
            toast.error(payload.new.message);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [deviceId]);

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

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">AI Insights</h3>
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
                <p className="text-xs text-gray-500 mt-1">
                  Confidence: {(insight.confidence * 100).toFixed(1)}% | 
                  {new Date(insight.created_at).toLocaleTimeString()}
                </p>
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