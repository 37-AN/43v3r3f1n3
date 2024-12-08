import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { pipeline } from "@huggingface/transformers";

interface DataAnalyzerProps {
  selectedDeviceId: string;
  simulatedData: Record<string, number>;
}

export const DataAnalyzer = ({ selectedDeviceId, simulatedData }: DataAnalyzerProps) => {
  const [featureExtractor, setFeatureExtractor] = useState<any>(null);

  useEffect(() => {
    const initializeAI = async () => {
      try {
        console.log('Initializing AI models...');
        const extractor = await pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2",
          { revision: "main" }
        );
        setFeatureExtractor(extractor);
        console.log('AI models initialized successfully');
        toast.success('AI models loaded successfully');
      } catch (error) {
        console.error('Error initializing AI models:', error);
        toast.error('Failed to load AI models');
      }
    };

    initializeAI();
  }, []);

  useEffect(() => {
    if (selectedDeviceId && Object.keys(simulatedData).length > 0 && featureExtractor) {
      const analyzeData = async () => {
        try {
          console.log('Analyzing data for device:', selectedDeviceId, 'Data:', simulatedData);
          
          // Convert numerical data to text format for feature extraction
          const textData = Object.entries(simulatedData).map(
            ([key, value]) => `${key}: ${value}`
          );

          // Extract features using the AI model
          const features = await featureExtractor(textData, {
            pooling: "mean",
            normalize: true
          });

          console.log('Extracted features:', features);

          // Send data and features to the analysis function
          const { data, error } = await supabase.functions.invoke('analyze-plc-data', {
            body: {
              deviceId: selectedDeviceId,
              data: simulatedData,
              features: features.tolist()
            }
          });

          if (error) {
            console.error('Error analyzing data:', error);
            throw error;
          }

          console.log('Analysis result:', data);
        } catch (error) {
          console.error('Error analyzing data:', error);
          toast.error('Failed to analyze PLC data');
        }
      };

      const analysisInterval = setInterval(analyzeData, 30000);
      return () => clearInterval(analysisInterval);
    }
  }, [selectedDeviceId, simulatedData, featureExtractor]);

  return null; // This component doesn't render anything
};