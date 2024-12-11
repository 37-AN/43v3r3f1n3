import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useConsole } from '@/contexts/ConsoleContext';
import { AIInsight } from '@/types/ai';
import { toast } from 'sonner';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export function useAIInsightsFetching(deviceId: string) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { addMessage } = useConsole();

  const fetchInsights = useCallback(async (attempt = 0) => {
    if (!deviceId) {
      console.log('No device ID provided');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Attempt ${attempt + 1}: Fetching insights for device:`, deviceId);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        console.error('No active session');
        toast.error('Please log in to view insights');
        addMessage('error', 'Authentication required');
        return;
      }

      // Add exponential backoff delay for retries
      if (attempt > 0) {
        const backoffDelay = Math.min(RETRY_DELAY * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${backoffDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }

      const { data: deviceData, error: deviceError } = await supabase
        .from('plc_devices')
        .select('id, owner_id')
        .eq('id', deviceId)
        .single();

      if (deviceError) {
        throw deviceError;
      }

      if (!deviceData) {
        throw new Error('Device not found or no access');
      }

      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      console.log('Received insights data:', data);
      setInsights(data as AIInsight[]);
      setRetryCount(0);

    } catch (error) {
      console.error('Error in fetchInsights:', error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying... Attempt ${attempt + 1} of ${MAX_RETRIES}`);
        setRetryCount(attempt + 1);
        return fetchInsights(attempt + 1);
      }

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
    retryCount,
    fetchInsights
  };
}