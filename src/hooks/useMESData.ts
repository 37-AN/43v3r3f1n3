import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MESMetric, TokenizedAsset } from "@/types/tokenize";
import { toast } from "sonner";

export const useMESData = (deviceId: string) => {
  const fetchMESData = async () => {
    console.log('Fetching MES data for device:', deviceId);
    
    const [metricsResponse, assetsResponse, refinedDataResponse] = await Promise.all([
      supabase
        .from('mes_metrics')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: false })
        .limit(10),
      supabase
        .from('tokenized_assets')
        .select('*')
        .filter('metadata->device_id', 'eq', deviceId)
        .order('created_at', { ascending: false }),
      supabase
        .from('refined_mes_data')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: false })
        .limit(100)
    ]);

    if (metricsResponse.error) {
      console.error('Error fetching MES metrics:', metricsResponse.error);
      toast.error('Failed to load MES metrics');
      throw metricsResponse.error;
    }

    if (assetsResponse.error) {
      console.error('Error fetching tokenized assets:', assetsResponse.error);
      toast.error('Failed to load tokenized assets');
      throw assetsResponse.error;
    }

    if (refinedDataResponse.error) {
      console.error('Error fetching refined data:', refinedDataResponse.error);
      toast.error('Failed to load refined data');
      throw refinedDataResponse.error;
    }

    console.log('Fetched MES metrics:', metricsResponse.data);
    console.log('Fetched tokenized assets:', assetsResponse.data);
    console.log('Fetched refined data:', refinedDataResponse.data);

    return {
      mesMetrics: metricsResponse.data as MESMetric[],
      tokenizedAssets: assetsResponse.data as TokenizedAsset[],
      refinedData: refinedDataResponse.data
    };
  };

  const { data, isLoading } = useQuery({
    queryKey: ['mes-data', deviceId],
    queryFn: fetchMESData,
    enabled: !!deviceId,
  });

  return {
    mesMetrics: data?.mesMetrics || [],
    tokenizedAssets: data?.tokenizedAssets || [],
    refinedData: data?.refinedData || [],
    isLoading
  };
};