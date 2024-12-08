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
          
          // Extract and format data
          const textData = Object.entries(simulatedData)
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
              
              return finalValue !== null ? `${key}: ${finalValue}` : null;
            })
            .filter((item): item is string => Boolean(item));

          if (textData.length === 0) {
            console.log('No valid data to analyze');
            return;
          }

          const inputText = textData.join('. ');
          console.log('Prepared text for analysis:', inputText);

          const features = await featureExtractor(inputText, {
            pooling: "mean",
            normalize: true
          });

          if (!features) {
            console.error('Feature extraction returned no results');
            throw new Error('Feature extraction failed - no features returned');
          }

          console.log('Feature extraction successful:', features);

          const { data, error } = await supabase.functions.invoke('analyze-plc-data', {
            body: {
              deviceId: selectedDeviceId,
              data: simulatedData,
              features: features.tolist()
            }
          });

          if (error) {
            console.error('Error in data analysis:', error);
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