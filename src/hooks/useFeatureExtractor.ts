import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Custom analyzer that doesn't rely on external AI models
export const useFeatureExtractor = () => {
  const [analyzer, setAnalyzer] = useState<any>(null);

  useEffect(() => {
    const initializeAnalyzer = async () => {
      try {
        console.log('Initializing custom data analyzer...');
        
        // Create our custom analyzer function
        const customAnalyzer = (input: any) => {
          console.log('Analyzing input:', input);
          
          if (!input || typeof input !== 'string') {
            console.log('Invalid input, returning default features');
            return {
              tolist: () => [0, 0, 0],
              mean: 0,
              variance: 0,
              range: 0
            };
          }
          
          // Convert input to numerical features
          const words = input.split(' ');
          const numbers = words
            .map(word => parseFloat(word))
            .filter(num => !isNaN(num));
          
          if (numbers.length === 0) {
            console.log('No valid numbers found in input');
            return {
              tolist: () => [0, 0, 0],
              mean: 0,
              variance: 0,
              range: 0
            };
          }
          
          // Calculate basic statistical features
          const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
          const range = Math.max(...numbers) - Math.min(...numbers);
          
          console.log('Calculated features:', { mean, variance, range });
          
          // Return feature vector
          return {
            tolist: () => [mean, variance, range],
            mean,
            variance,
            range
          };
        };

        setAnalyzer(customAnalyzer);
        console.log('Custom analyzer initialized successfully');
        toast.success('Data analyzer initialized');
      } catch (error) {
        console.error('Error initializing analyzer:', error);
        toast.error('Failed to initialize data analyzer');
      }
    };

    initializeAnalyzer();
  }, []);

  return analyzer;
};