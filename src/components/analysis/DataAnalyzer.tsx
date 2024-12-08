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
          "Xenova/all-MiniLM-L6-v2"
        );
        
        if (!extractor) {
          throw new Error('Failed to initialize feature extractor');
        }

        // Test with a simple, guaranteed valid input
        const testInput = "Test input string";
        console.log('Testing model with input:', testInput);
        
        if (!testInput || typeof testInput !== 'string') {
          throw new Error('Invalid test input format');
        }

        const testFeatures = await extractor(testInput, {
          pooling: "mean",
          normalize: true
        });
        
        if (!testFeatures) {
          throw new Error('Model test failed - no features returned');
        }
        
        console.log('Model test successful:', testFeatures !== null);
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
          console.log('Analyzing data for device:', selectedDeviceId);
          
          // Ensure we have valid data to process
          const textData = Object.entries(simulatedData)
            .filter(([_, value]) => value !== null && value !== undefined)
            .map(([key, value]) => `${key}: ${value}`);

          if (textData.length === 0) {
            console.log('No valid data to analyze');
            return;
          }

          // Join data points with periods for better context
          const inputText = textData.join('. ');
          console.log('Processing text data:', inputText);

          if (!inputText || typeof inputText !== 'string') {
            throw new Error('Invalid input text format');
          }

          // Extract features using the AI model
          const features = await featureExtractor(inputText, {
            pooling: "mean",
            normalize: true
          });

          if (!features) {
            console.error('Feature extraction failed - no features returned');
            return;
          }

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