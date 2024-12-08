import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface DataAnalysisProcessorProps {
  selectedDeviceId: string;
  simulatedData: Record<string, any>;
  featureExtractor: any;
}

export const DataAnalysisProcessor = ({ 
  selectedDeviceId, 
  simulatedData, 
  featureExtractor 
}: DataAnalysisProcessorProps) => {
  useEffect(() => {
    if (selectedDeviceId && Object.keys(simulatedData).length > 0 && featureExtractor) {
      const analyzeData = async () => {
        try {
          console.log('Starting data analysis for device:', selectedDeviceId);
          console.log('Current simulated data:', simulatedData);
          
          // Extract numerical values from simulated data
          const numericalData = Object.entries(simulatedData)
            .map(([key, value]) => {
              if (!value) return null;
              
              let finalValue: number | null = null;
              
              if (typeof value === 'object' && value !== null) {
                if ('value' in value && 
                    typeof value.value === 'object' && 
                    value.value !== null && 
                    'value' in value.value) {
                  const numValue = Number(value.value.value);
                  if (!isNaN(numValue)) {
                    finalValue = numValue;
                  }
                }
              } else if (typeof value === 'number' && !isNaN(value)) {
                finalValue = value;
              }
              
              return finalValue !== null ? `${finalValue}` : null;
            })
            .filter((item): item is string => item !== null);

          if (numericalData.length === 0) {
            console.log('No valid numerical data to analyze');
            return;
          }

          const inputText = numericalData.join(' ');
          console.log('Prepared data for analysis:', inputText);

          const features = featureExtractor(inputText);
          console.log('Extracted features:', features);

          // Generate insight based on statistical analysis
          const generateInsight = (features: any) => {
            const { mean, variance, range } = features;
            let message = '';
            let severity: 'info' | 'warning' | 'critical' = 'info';
            let confidence = 0.8;

            if (variance > 1000) {
              message = `High data variability detected (variance: ${variance.toFixed(2)})`;
              severity = 'warning';
            } else if (range > 100) {
              message = `Large value range detected (${range.toFixed(2)} units)`;
              severity = 'warning';
            } else if (Math.abs(mean) > 50) {
              message = `Unusual average value detected (${mean.toFixed(2)})`;
              severity = 'info';
            } else {
              message = `System operating within normal parameters`;
              confidence = 0.95;
            }

            return { message, severity, confidence };
          };

          const insight = generateInsight(features);
          console.log('Generated insight:', insight);

          const { data, error } = await supabase.from('ai_insights').insert([{
            device_id: selectedDeviceId,
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

          console.log('Analysis completed successfully:', data);
        } catch (error) {
          console.error('Error in data analysis:', error);
          toast.error('Failed to analyze PLC data');
        }
      };

      const analysisInterval = setInterval(analyzeData, 30000);
      return () => clearInterval(analysisInterval);
    }
  }, [selectedDeviceId, simulatedData, featureExtractor]);

  return null;
};