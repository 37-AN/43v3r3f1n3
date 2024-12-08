import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useLLMAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeData = async (deviceId: string, data: any[], timeRange: string) => {
    setIsAnalyzing(true);
    try {
      console.log('Starting analysis for device:', deviceId);
      
      const prompt = `Analyze this industrial IoT data and provide insights:
Device ID: ${deviceId}
Time Range: ${timeRange}
Data Points: ${JSON.stringify(data, null, 2)}

Provide insights about:
1. Performance patterns
2. Anomalies
3. Optimization recommendations
4. Predictive maintenance needs`;

      const { data: analysisData, error } = await supabase.functions.invoke('ai-analysis', {
        body: { prompt }
      });

      if (error) throw error;

      const analysis = analysisData.analysis;
      
      // Store the insight in Supabase
      const { error: insightError } = await supabase
        .from('ai_insights')
        .insert({
          device_id: deviceId,
          insight_type: 'openai_analysis',
          message: analysis,
          confidence: 0.95,
          severity: 'info',
          metadata: {
            model: 'gpt-4o-mini',
            analyzed_data_points: data.length,
            time_range: timeRange
          }
        });

      if (insightError) {
        console.error('Error storing insight:', insightError);
        toast.error('Failed to store analysis results');
        throw insightError;
      }

      console.log('Analysis completed:', analysis);
      toast.success('Analysis completed successfully');
      
      return analysis;
    } catch (error) {
      console.error('Error in analysis:', error);
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