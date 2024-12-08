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
        
        // First verify device exists and user has access
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No active session');
          toast.error('Please log in to analyze data');
          return null;
        }

        const { data: deviceData, error: deviceError } = await supabase
          .from('plc_devices')
          .select('id, owner_id')
          .eq('id', selectedDeviceId)
          .single();

        if (deviceError) {
          console.error('Error fetching device:', deviceError);
          toast.error('Failed to verify device access');
          return null;
        }

        if (!deviceData) {
          console.error('Device not found or no access');
          toast.error('Device not found or no access');
          return null;
        }

        console.log('Device data:', deviceData);
        
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

        // Format data for industrial-data-refinery
        const rawData = {
          deviceId: selectedDeviceId,
          dataType: 'measurement',
          values: values,
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'plc_analysis',
            owner_id: session.user.id
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

        // Send refined data to MES tokenization engine
        const { data: mesData, error: mesError } = await supabase.functions.invoke('mes-tokenization-engine', {
          body: { 
            refinedData,
            timestamp: new Date().toISOString()
          }
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