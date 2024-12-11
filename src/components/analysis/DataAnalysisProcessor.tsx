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
        
        // Format data for industrial-data-refinery with explicit deviceId
        const rawData = {
          deviceId: selectedDeviceId,
          dataType: 'measurement',
          metrics: preparedData.split(' ').map(value => ({
            metric_type: 'measurement',
            value: Number(value),
            timestamp: new Date().toISOString(),
            unit: 'unit'
          })),
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'plc_analysis',
            deviceId: selectedDeviceId // Add deviceId to metadata as well
          }
        };

        console.log('Sending data to industrial-data-refinery:', rawData);

        // Get AI analysis from our edge function
        const { data: refinedData, error: aiError } = await supabase.functions.invoke('industrial-data-refinery', {
          body: { rawData }
        });

        if (aiError) {
          console.error('Error in AI analysis:', aiError);
          toast.error('Failed to process data in AI refinery');
          return null;
        }

        console.log('Received refined data:', refinedData);

        // Send refined data to MES tokenization engine with explicit deviceId
        const mesRequestBody = {
          refinedData: {
            ...refinedData,
            deviceId: selectedDeviceId,
            timestamp: new Date().toISOString()
          }
        };

        console.log('Sending data to MES tokenization engine:', mesRequestBody);

        const { data: mesData, error: mesError } = await supabase.functions.invoke('mes-tokenization-engine', {
          body: mesRequestBody
        });

        if (mesError) {
          console.error('Error in MES tokenization:', mesError);
          toast.error('Failed to process in MES engine');
          return null;
        }

        console.log('MES tokenization response:', mesData);

        const features = featureExtractor(preparedData);
        console.log('Extracted features:', features);

        const insight = refinedData?.analysis ? {
          message: refinedData.analysis,
          severity: refinedData.severity || 'info',
          confidence: refinedData.confidence || 0.85
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