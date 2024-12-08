import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MESMetric {
  id: string;
  device_id: string;
  metric_type: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata: {
    quality_score: number;
    source: string;
    category: string;
  };
}

interface TokenizedAsset {
  id: string;
  asset_type: string;
  name: string;
  description: string;
  token_symbol: string;
  total_supply: number;
  price_per_token: number;
  metadata: {
    source_metric: MESMetric;
    timestamp: string;
    quality_score: number;
  };
}

export const useMESData = (deviceId: string) => {
  const { data: mesMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['mes-metrics', deviceId],
    queryFn: async () => {
      console.log('Fetching MES metrics for device:', deviceId);
      const { data, error } = await supabase
        .from('mes_metrics')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching MES metrics:', error);
        toast.error('Failed to fetch MES metrics');
        throw error;
      }

      console.log('Retrieved MES metrics:', data);
      return data as MESMetric[];
    },
    refetchInterval: 5000
  });

  const { data: tokenizedAssets, isLoading: tokensLoading } = useQuery({
    queryKey: ['tokenized-assets', deviceId],
    queryFn: async () => {
      console.log('Fetching tokenized assets for device:', deviceId);
      const { data, error } = await supabase
        .from('tokenized_assets')
        .select('*')
        .eq('metadata->source_metric->device_id', deviceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tokenized assets:', error);
        toast.error('Failed to fetch tokenized assets');
        throw error;
      }

      console.log('Retrieved tokenized assets:', data);
      return data as TokenizedAsset[];
    },
    refetchInterval: 5000
  });

  return {
    mesMetrics,
    tokenizedAssets,
    isLoading: metricsLoading || tokensLoading
  };
};