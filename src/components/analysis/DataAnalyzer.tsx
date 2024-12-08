import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface DataAnalyzerProps {
  selectedDeviceId: string;
  simulatedData: Record<string, number>;
}

export const DataAnalyzer = ({ selectedDeviceId, simulatedData }: DataAnalyzerProps) => {
  useEffect(() => {
    if (selectedDeviceId && Object.keys(simulatedData).length > 0) {
      const analyzeData = async () => {
        try {
          console.log('Analyzing data for device:', selectedDeviceId, 'Data:', simulatedData);
          
          const { data, error } = await supabase.functions.invoke('analyze-plc-data', {
            body: {
              deviceId: selectedDeviceId,
              data: simulatedData
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
  }, [selectedDeviceId, simulatedData]);

  return null; // This component doesn't render anything
};