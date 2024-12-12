import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useConsole } from '@/contexts/ConsoleContext';
import { AIInsight } from '@/types/ai';
import { toast } from 'sonner';

export function useAIInsightsFetching(deviceId: string) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addMessage } = useConsole();

  const fetchInsights = useCallback(async () => {
    if (!deviceId) {
      console.log('No device ID provided');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching insights for device:', deviceId);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        console.error('No active session');
        toast.error('Please log in to view insights');
        addMessage('error', 'Authentication required');
        return;
      }

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
        return;
      }

      console.log('Received insights data:', data);
      setInsights(data as AIInsight[]);

    } catch (error) {
      console.error('Error in fetchInsights:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load insights: ${errorMessage}`);
      addMessage('error', `Failed to load insights: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, addMessage]);

  return {
    insights,
    isLoading,
    fetchInsights
  };
}