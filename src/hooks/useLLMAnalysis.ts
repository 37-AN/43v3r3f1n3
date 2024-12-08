import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useLLMAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeData = async (deviceId: string, data: any[], timeRange: string) => {
    setIsAnalyzing(true);
    try {
      console.log('Starting LLM analysis for device:', deviceId);
      
      const { data: response, error } = await supabase.functions.invoke('llm-insights', {
        body: { deviceId, data, timeRange }
      });

      if (error) {
        console.error('Error calling LLM insights function:', error);
        toast.error('Failed to analyze data');
        throw error;
      }

      console.log('LLM analysis completed:', response);
      toast.success('Analysis completed successfully');
      
      return response.analysis;
    } catch (error) {
      console.error('Error in LLM analysis:', error);
      toast.error('Failed to analyze data');
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeData,
    isAnalyzing
  };
};