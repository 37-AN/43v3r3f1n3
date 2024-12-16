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

    try {
      // Format metrics with proper structure
      const metrics = Object.entries(simulatedData)
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
          
          return finalValue !== null ? {
            metric_type: key,
            value: finalValue,
            timestamp: new Date().toISOString(),
            unit: key === 'temperature' ? '°C' :
                  key === 'pressure' ? 'bar' :
                  key === 'vibration' ? 'mm/s' :
                  key === 'production_rate' ? 'units/hr' :
                  key === 'downtime_minutes' ? 'min' :
                  key === 'defect_rate' ? '%' :
                  key === 'energy_consumption' ? 'kWh' :
                  key === 'machine_efficiency' ? '%' : 'unit',
            metadata: {
              quality_score: 0.95,
              source: 'simulation_engine'
            }
          } : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (metrics.length > 0) {
        const preparedData = {
          rawData: {
            metrics,
            timestamp: new Date().toISOString(),
            metadata: {
              simulation: true,
              source: 'simulation_engine',
              quality_score: 0.95
            }
          }
        };
        
        console.log('Prepared data for analysis:', preparedData);
        onPreparedData(JSON.stringify(preparedData));
      } else {
        console.log('No valid numerical data to analyze');
      }
    } catch (error) {
      console.error('Error preparing data:', error);
    }
  };

  useEffect(() => {
    prepareData();
  }, [simulatedData]);

  return null;
};