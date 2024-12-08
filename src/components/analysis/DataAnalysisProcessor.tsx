import { useEffect } from 'react';
import { toast } from 'sonner';
import { DataPreparation } from './DataPreparation';
import { InsightStorage } from './InsightStorage';
import { generateInsight } from '@/utils/insightGenerator';
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
    if (!selectedDeviceId || !featureExtractor) {
      console.log('Missing required props:', { selectedDeviceId, featureExtractor });
      return;
    }

    const analyzeData = async (preparedData: string) => {
      try {
        console.log('Starting data analysis for device:', selectedDeviceId);
        
        const features = featureExtractor(preparedData);
        console.log('Extracted features:', features);

        // Validate and format raw data
        if (!preparedData) {
          console.error('No prepared data available');
          return null;
        }

        const values = preparedData.split(' ').map(Number);
        if (values.length === 0 || values.some(isNaN)) {
          console.error('Invalid numerical values in prepared data');
          return null;
        }

        const formattedData = {
          deviceId: selectedDeviceId,
          dataType: 'measurement',
          values: values,
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'plc_analysis',
            featureCount: features.length
          }
        };

        console.log('Sending formatted data to edge function:', formattedData);

        // Get AI analysis from our edge function
        const { data: aiData, error: aiError } = await supabase.functions.invoke('industrial-data-refinery', {
          body: { 
            rawData: formattedData
          }
        });

        if (aiError) {
          console.error('Error in AI analysis:', aiError);
          toast.error('Failed to process data in AI refinery');
          return null;
        }

        console.log('AI analysis response:', aiData);

        if (!aiData || !aiData.deviceId) {
          console.error('Invalid AI analysis response');
          return null;
        }

        const insight = aiData?.analysis ? {
          message: aiData.analysis,
          severity: aiData.severity || 'info',
          confidence: aiData.confidence || 0.85
        } : generateInsight(features);

        console.log('Generated insight:', insight);
        return { features, insight };
      } catch (error) {
        console.error('Error in data analysis:', error);
        toast.error('Failed to analyze PLC data');
        return null;
      }
    };

    const analysisInterval = setInterval(() => {
      const handlePreparedData = async (preparedData: string) => {
        const result = await analyzeData(preparedData);
        if (result) {
          const { features, insight } = result;
          return <InsightStorage 
            deviceId={selectedDeviceId}
            insight={insight}
            features={features}
          />;
        }
      };

      return <DataPreparation 
        simulatedData={simulatedData}
        onPreparedData={handlePreparedData}
      />;
    }, 30000);

    return () => clearInterval(analysisInterval);
  }, [selectedDeviceId, simulatedData, featureExtractor]);

  return null;
};