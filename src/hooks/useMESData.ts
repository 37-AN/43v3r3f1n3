import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MESMetric, TokenizedAsset } from "@/types/tokenize";

export const useMESData = (deviceId: string) => {
  const fetchMESData = async () => {
    console.log('Fetching MES data for device:', deviceId);
    
    if (!deviceId) {
      throw new Error('Device ID is required');
    }

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
        .contains('metadata', { device_id: deviceId })
        .order('created_at', { ascending: false }),
      supabase
        .from('refined_mes_data')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: true })
        .limit(100)
    ]);

    if (metricsResponse.error) {
      console.error('Error fetching MES metrics:', metricsResponse.error);
      throw new Error('Failed to load MES metrics');
    }

    if (assetsResponse.error) {
      console.error('Error fetching tokenized assets:', assetsResponse.error);
      throw new Error('Failed to load tokenized assets');
    }

    if (refinedDataResponse.error) {
      console.error('Error fetching refined data:', refinedDataResponse.error);
      throw new Error('Failed to load refined data');
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['mes-data', deviceId],
    queryFn: fetchMESData,
    enabled: !!deviceId,
    retry: 1
  });

  return {
    mesMetrics: data?.mesMetrics || [],
    tokenizedAssets: data?.tokenizedAssets || [],
    refinedData: data?.refinedData || [],
    isLoading,
    error
  };
};