import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMESData(deviceId: string) {
  const fetchMESMetrics = async () => {
    try {
      const { data: metrics, error } = await supabase
        .from('mes_metrics')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      return metrics;
    } catch (error) {
      console.error('Error fetching MES metrics:', error);
      toast.error('Failed to fetch MES metrics');
      throw error;
    }
  };

  const fetchTokenizedAssets = async () => {
    try {
      const { data: assets, error } = await supabase
        .from('tokenized_assets')
        .select('*')
        .filter('metadata->source_device_id', 'eq', deviceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return assets;
    } catch (error) {
      console.error('Error fetching tokenized assets:', error);
      toast.error('Failed to fetch tokenized assets');
      throw error;
    }
  };

  const { data: mesMetrics, isLoading: mesLoading } = useQuery({
    queryKey: ['mes_metrics', deviceId],
    queryFn: fetchMESMetrics,
    enabled: !!deviceId
  });

  const { data: tokenizedAssets, isLoading: assetsLoading } = useQuery({
    queryKey: ['tokenized_assets', deviceId],
    queryFn: fetchTokenizedAssets,
    enabled: !!deviceId
  });

  return {
    mesMetrics,
    tokenizedAssets,
    isLoading: mesLoading || assetsLoading
  };
}