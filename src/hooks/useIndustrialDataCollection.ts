import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IndustrialMetric {
  type: string;
  value: number;
  metadata?: Record<string, any>;
  timestamp?: string;
}

interface CollectionResult {
  success: boolean;
  refinedMetrics?: any[];
  error?: string;
}

export function useIndustrialDataCollection() {
  const [isCollecting, setIsCollecting] = useState(false);

  const collectData = async (
    deviceId: string,
    metrics: IndustrialMetric[]
  ): Promise<CollectionResult> => {
    try {
      setIsCollecting(true);
      console.log('Collecting industrial data for device:', deviceId);

      const { data, error } = await supabase.functions.invoke(
        'industrial-data-collector',
        {
          body: {
            deviceId,
            metrics: metrics.map(metric => ({
              ...metric,
              timestamp: metric.timestamp || new Date().toISOString()
            }))
          }
        }
      );

      if (error) {
        console.error('Error collecting industrial data:', error);
        toast.error('Failed to collect industrial data');
        return { success: false, error: error.message };
      }

      console.log('Successfully collected and refined data:', data);
      toast.success('Industrial data collected and processed');
      return { success: true, refinedMetrics: data.refinedMetrics };

    } catch (error) {
      console.error('Error in data collection:', error);
      toast.error('Error collecting industrial data');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsCollecting(false);
    }
  };

  return {
    collectData,
    isCollecting
  };
}