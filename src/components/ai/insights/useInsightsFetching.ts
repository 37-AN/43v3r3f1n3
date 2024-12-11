import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useConsole } from '@/contexts/ConsoleContext';
import { AIInsight } from '@/types/ai';
import { toast } from 'sonner';

export function useInsightsFetching(deviceId: string) {
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
      
      // First verify device exists and user has access
      const { data: deviceData, error: deviceError } = await supabase
        .from('plc_devices')
        .select('id, owner_id')
        .eq('id', deviceId)
        .single();

      if (deviceError) {
        console.error('Error checking device:', deviceError);
        if (deviceError.message.includes('JWT')) {
          const session = await supabase.auth.getSession();
          if (!session.data.session) {
            toast.error('Session expired. Please log in again.');
            addMessage('error', 'Session expired. Please log in again.');
            return;
          }
          // If we have a session but got a JWT error, retry
          if (attempt < 3) {
            const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(`Retrying after ${backoffDelay}ms...`);
            setTimeout(() => fetchInsights(attempt + 1), backoffDelay);
            return;
          }
        }
        toast.error('Error checking device access');
        addMessage('error', `Error checking device: ${deviceError.message}`);
        return;
      }

      if (!deviceData) {
        console.error('Device not found or no access');
        toast.error('Device not found or no access');
        addMessage('error', 'Device not found or no access');
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
        if (error.message.includes('JWT') && attempt < 3) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`Retrying after ${backoffDelay}ms...`);
          setTimeout(() => fetchInsights(attempt + 1), backoffDelay);
          return;
        }
        toast.error('Failed to fetch insights');
        addMessage('error', `Failed to fetch insights: ${error.message}`);
        return;
      }

      console.log('Received insights data:', data);
      setInsights(data as AIInsight[]);
      setRetryCount(0); // Reset retry count on success

    } catch (error) {
      console.error('Unexpected error:', error);
      if (attempt < 3) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`Retrying after ${backoffDelay}ms...`);
        setTimeout(() => fetchInsights(attempt + 1), backoffDelay);
      } else {
        toast.error('Failed to process insights');
        addMessage('error', `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, addMessage]);

  useEffect(() => {
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
            toast.error(payload.new.message);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [deviceId, fetchInsights, addMessage]);

  return { insights, isLoading, refetch: () => fetchInsights() };
}