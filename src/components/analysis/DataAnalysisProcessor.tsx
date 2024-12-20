import { useEffect } from 'react';
import { DataPreparation } from './DataPreparation';
import { InsightStorage } from './InsightStorage';
import { generateInsight } from '@/utils/insightGenerator';
import { processAnalysisData } from '@/utils/analysis/dataProcessor';
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
      const refinedData = await processAnalysisData(selectedDeviceId, preparedData, session);
      
      if (!refinedData) {
        return null;
      }

      const features = featureExtractor(preparedData);
      console.log('Extracted features:', features);

      const insight = refinedData?.analysis ? {
        message: refinedData.analysis,
        severity: refinedData.severity || 'info',
        confidence: refinedData.confidence || 0.85
      } : generateInsight(features);

      console.log('Generated insight:', insight);
      return { features, insight };
    };

    const analysisInterval = setInterval(async () => {
      if (!simulatedData || Object.keys(simulatedData).length === 0) {
        console.log('No simulated data available');
        return;
      }

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