import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAIAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeDeviceData = async (
    deviceId: string,
    timeRange: { start: string; end: string },
    metrics: Record<string, number>
  ) => {
    setIsAnalyzing(true);
    try {
      console.log('Starting AI analysis for device:', deviceId);
      
      const { data, error } = await supabase.functions.invoke('industrial-ai-analysis', {
        body: { 
          deviceId,
          timeRange,
          metrics
        }
      });

      if (error) {
        console.error('Error in AI analysis:', error);
        toast.error('Failed to analyze device data');
        throw error;
      }

      console.log('AI analysis completed:', data);
      toast.success('Analysis completed successfully');
      
      return data.analysis;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to analyze data');
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeDeviceData,
    isAnalyzing
  };
};