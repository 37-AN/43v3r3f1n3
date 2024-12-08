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
        console.log('Starting AI model initialization...');
        
        // Initialize the pipeline with explicit model configuration
        const extractor = await pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2",
          {
            quantized: false, // Disable quantization to ensure full model loading
            revision: "main"
          }
        );
        
        if (!extractor) {
          console.error('Feature extractor initialization failed');
          throw new Error('Failed to initialize feature extractor');
        }

        console.log('Feature extractor created successfully');

        // Test the model with a simple string
        const testInput = "Hello world";
        console.log('Testing model with input:', testInput);

        // Validate test input
        if (!testInput || typeof testInput !== 'string') {
          console.error('Invalid test input:', testInput);
          throw new Error('Invalid test input format');
        }

        // Test feature extraction
        const testFeatures = await extractor(testInput, {
          pooling: "mean",
          normalize: true
        });

        if (!testFeatures) {
          console.error('Test feature extraction failed');
          throw new Error('Model test failed - no features returned');
        }

        console.log('Model test successful:', testFeatures !== null);
        setFeatureExtractor(extractor);
        console.log('AI model initialization completed successfully');
        toast.success('AI models loaded successfully');
      } catch (error) {
        console.error('Error in AI initialization:', error);
        toast.error('Failed to load AI models');
      }
    };

    initializeAI();
  }, []);

  useEffect(() => {
    if (selectedDeviceId && Object.keys(simulatedData).length > 0 && featureExtractor) {
      const analyzeData = async () => {
        try {
          console.log('Starting data analysis for device:', selectedDeviceId);
          console.log('Current simulated data:', simulatedData);
          
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
          console.log('Prepared text for analysis:', inputText);

          // Validate input text
          if (!inputText || typeof inputText !== 'string') {
            console.error('Invalid input text:', inputText);
            throw new Error('Invalid input text format');
          }

          // Extract features using the AI model
          console.log('Starting feature extraction...');
          const features = await featureExtractor(inputText, {
            pooling: "mean",
            normalize: true
          });

          if (!features) {
            console.error('Feature extraction returned no results');
            throw new Error('Feature extraction failed - no features returned');
          }

          console.log('Feature extraction successful:', features);

          // Send data and features to the analysis function
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

  return null; // This component doesn't render anything
};