import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useConsole } from '@/contexts/ConsoleContext';
import { AIInsight } from '@/types/ai';
import { toast } from 'sonner';

export function useInsightsFetching(deviceId: string) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const { addMessage } = useConsole();

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        if (!deviceId) {
          console.log('No device ID provided');
          return;
        }

        console.log('Fetching insights for device:', deviceId);
        
        // First verify device exists and user has access
        const { data: deviceData, error: deviceError } = await supabase
          .from('plc_devices')
          .select('id, owner_id')
          .eq('id', deviceId)
          .single();

        if (deviceError) {
          console.error('Error checking device:', deviceError);
          if (deviceError.message.includes('JWT')) {
            toast.error('Session expired. Please log in again.');
          } else {
            toast.error('Error checking device access');
          }
          return;
        }

        if (!deviceData) {
          console.error('Device not found or no access');
          toast.error('Device not found or no access');
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
            toast.error('Session expired. Please log in again.');
          } else {
            toast.error('Failed to fetch insights');
          }
          return;
        }

        console.log('Received insights data:', data);
        setInsights(data as AIInsight[]);
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('Failed to process insights');
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
            toast.error(payload.new.message);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [deviceId, addMessage]);

  return { insights };
}