import React, { useEffect } from 'react';

interface DataPreparationProps {
  simulatedData: Record<string, any>;
  onPreparedData: (data: string) => void;
}

export const DataPreparation = ({ simulatedData, onPreparedData }: DataPreparationProps) => {
  const prepareData = () => {
    if (!simulatedData || Object.keys(simulatedData).length === 0) {
      console.log('No data to prepare');
      return;
    }

    const numericalData = Object.entries(simulatedData)
      .map(([key, value]) => {
        if (!value) return null;
        
        let finalValue: number | null = null;
        
        if (typeof value === 'object' && value !== null) {
          if ('value' in value && 
              typeof value.value === 'object' && 
              value.value !== null && 
              'value' in value.value) {
            const numValue = Number(value.value.value);
            if (!isNaN(numValue)) {
              finalValue = numValue;
            }
          }
        } else if (typeof value === 'number' && !isNaN(value)) {
          finalValue = value;
        }
        
        return finalValue !== null ? `${finalValue}` : null;
      })
      .filter((item): item is string => item !== null);

    if (numericalData.length > 0) {
      const inputText = numericalData.join(' ');
      console.log('Prepared data for analysis:', inputText);
      onPreparedData(inputText);
    } else {
      console.log('No valid numerical data to analyze');
    }
  };

  useEffect(() => {
    prepareData();
  }, [simulatedData]);

  return null;
};