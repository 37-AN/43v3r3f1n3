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
        const customAnalyzer = (text: string) => {
          console.log('Analyzing text:', text);
          
          // Convert input to numerical features
          const words = text.split(' ');
          const numbers = words
            .map(word => parseFloat(word))
            .filter(num => !isNaN(num));
          
          // Calculate basic statistical features
          const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
          const range = Math.max(...numbers) - Math.min(...numbers);
          
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