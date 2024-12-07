import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  refineArduinoData, 
  ArduinoPLCDataPoint,
  ProcessedArduinoData 
} from "@/utils/arduinoDataRefinement";

export const useArduinoDataProcessing = (rawData: ArduinoPLCDataPoint[]) => {
  const [processedData, setProcessedData] = useState<ProcessedArduinoData | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processData = async () => {
      try {
        console.log("Processing Arduino PLC data:", rawData);
        const results = await refineArduinoData(rawData);
        setProcessedData(results);

        if (results.anomalies.length > 0) {
          toast.warning(`Detected ${results.anomalies.length} anomalies in Arduino PLC data`);
        }

        console.log("Arduino PLC data processing completed successfully");
      } catch (error) {
        console.error("Error processing Arduino PLC data:", error);
        toast.error("Error processing Arduino PLC data");
      } finally {
        setIsProcessing(false);
      }
    };

    if (rawData.length > 0) {
      processData();
    } else {
      setIsProcessing(false);
    }
  }, [rawData]);

  return {
    processedData,
    isProcessing,
    hasAnomalies: processedData?.anomalies.length ?? 0 > 0
  };
};