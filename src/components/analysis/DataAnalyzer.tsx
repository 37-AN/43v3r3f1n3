import { useFeatureExtractor } from '@/hooks/useFeatureExtractor';
import { DataAnalysisProcessor } from './DataAnalysisProcessor';

interface DataAnalyzerProps {
  selectedDeviceId: string;
  simulatedData: Record<string, number>;
}

export const DataAnalyzer = ({ selectedDeviceId, simulatedData }: DataAnalyzerProps) => {
  const featureExtractor = useFeatureExtractor();

  if (!featureExtractor) {
    return null;
  }

  return (
    <DataAnalysisProcessor
      selectedDeviceId={selectedDeviceId}
      simulatedData={simulatedData}
      featureExtractor={featureExtractor}
    />
  );
};