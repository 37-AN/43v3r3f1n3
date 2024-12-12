import { useEffect } from 'react';
import { toast } from 'sonner';
import { DataPreparation } from './DataPreparation';
import { InsightStorage } from './InsightStorage';
import { generateInsight } from '@/utils/insightGenerator';
import { supabase } from "@/integrations/supabase/client";
import { useSession } from '@/hooks/useSession';

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
  const { session } = useSession();

  useEffect(() => {
    if (!selectedDeviceId || !featureExtractor || !session?.user) {
      console.log('Missing required props or session:', { selectedDeviceId, featureExtractor, session });
      return;
    }

    const analyzeData = async (preparedData: string) => {
      try {
        console.log('Starting data analysis for device:', selectedDeviceId);
        
        // Validate deviceId format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(selectedDeviceId)) {
          console.error('Invalid deviceId format:', selectedDeviceId);
          toast.error('Invalid device ID format');
          return null;
        }

        // Format metrics data
        const metrics = preparedData.split(' ').map(value => {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            console.error('Invalid numeric value:', value);
            return null;
          }
          return {
            metric_type: 'measurement',
            value: numValue,
            timestamp: new Date().toISOString(),
            unit: 'unit',
            metadata: {
              quality_score: 0.95,
              source: 'plc_analysis',
              device_id: selectedDeviceId
            }
          };
        }).filter(Boolean);

        if (metrics.length === 0) {
          console.error('No valid metrics to process');
          toast.error('No valid metrics to process');
          return null;
        }

        const rawData = {
          deviceId: selectedDeviceId,
          dataType: 'measurement',
          metrics: metrics,
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'plc_analysis',
            device_id: selectedDeviceId,
            quality_score: 0.95,
            owner_id: session.user.id
          }
        };

        console.log('Sending data to industrial-data-refinery:', { rawData });

        const { data: refinedData, error: refineryError } = await supabase.functions.invoke(
          'industrial-data-refinery',
          {
            body: { rawData }
          }
        );

        if (refineryError) {
          console.error('Error in data refinement:', refineryError);
          toast.error('Failed to process data in refinery');
          return null;
        }

        console.log('Received refined data:', refinedData);

        if (!refinedData) {
          console.error('No refined data received');
          return null;
        }

        // Generate features and insight
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
  }, [selectedDeviceId, simulatedData, featureExtractor, session]);

  return null;
};