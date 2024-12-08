import React, { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InsightStorageProps {
  deviceId: string;
  insight: {
    message: string;
    severity: string;
    confidence: number;
  };
  features: {
    mean: number;
    variance: number;
    range: number;
  };
}

export const InsightStorage = ({ deviceId, insight, features }: InsightStorageProps) => {
  const storeInsight = async () => {
    try {
      const { error } = await supabase.from('ai_insights').insert([{
        device_id: deviceId,
        insight_type: 'statistical_analysis',
        message: insight.message,
        confidence: insight.confidence,
        severity: insight.severity,
        metadata: {
          mean: features.mean,
          variance: features.variance,
          range: features.range
        }
      }]);

      if (error) {
        console.error('Error storing insight:', error);
        throw error;
      }

      console.log('Analysis stored successfully');
    } catch (error) {
      console.error('Error in storing insight:', error);
      toast.error('Failed to store analysis results');
    }
  };

  useEffect(() => {
    storeInsight();
  }, [deviceId, insight, features]);

  return null;
};