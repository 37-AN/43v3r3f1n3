import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { lmStudio } from '@/utils/lmstudio';

export const useLLMAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeData = async (deviceId: string, data: any[], timeRange: string) => {
    setIsAnalyzing(true);
    try {
      console.log('Starting LLM analysis for device:', deviceId);
      
      // Format data for analysis
      const prompt = `Analyze this industrial IoT data and provide insights:
Device ID: ${deviceId}
Time Range: ${timeRange}
Data Points: ${JSON.stringify(data, null, 2)}

Provide insights about:
1. Performance patterns
2. Anomalies
3. Optimization recommendations
4. Predictive maintenance needs`;

      // Get analysis from LM Studio
      const analysis = await lmStudio.analyze(prompt);
      
      // Store the insight in Supabase
      const { error: insightError } = await supabase
        .from('ai_insights')
        .insert({
          device_id: deviceId,
          insight_type: 'llm_analysis',
          message: analysis,
          confidence: 0.85,
          severity: 'info',
          metadata: {
            model: 'llm_studio',
            analyzed_data_points: data.length,
            time_range: timeRange
          }
        });

      if (insightError) {
        console.error('Error storing insight:', insightError);
        toast.error('Failed to store analysis results');
        throw insightError;
      }

      console.log('LLM analysis completed:', analysis);
      toast.success('Analysis completed successfully');
      
      return analysis;
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