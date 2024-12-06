import { useState, useEffect } from "react";
import { initializeAIModels, refineData } from "@/utils/dataRefinement";
import { ModbusRegisterData } from "@/types/modbus";
import { toast } from "sonner";
import { performanceData, resourceData } from "@/utils/sampleDataGenerator";

export const useDataProcessing = () => {
  const [refinedPerformance, setRefinedPerformance] = useState<ModbusRegisterData[]>([]);
  const [refinedResources, setRefinedResources] = useState<ModbusRegisterData[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);

  const processData = async () => {
    try {
      console.log("Initializing AI models and processing data");
      await initializeAIModels();
      
      const [performanceResults, resourceResults] = await Promise.all([
        refineData(performanceData),
        refineData(resourceData),
      ]);

      setRefinedPerformance(performanceResults.refinedData.map(data => ({
        ...data,
        registerType: 'holding',
        address: 1
      })));
      
      setRefinedResources(resourceResults.refinedData.map(data => ({
        ...data,
        registerType: 'input',
        address: 2
      })));

      if (performanceResults.anomalies.length > 0 || resourceResults.anomalies.length > 0) {
        toast.warning(`Detected ${performanceResults.anomalies.length + resourceResults.anomalies.length} anomalies`);
      }

      console.log("Data processing completed successfully");
    } catch (error) {
      console.error("Error processing data:", error);
      toast.error("Error processing data");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    processData();
  }, []);

  return {
    refinedPerformance,
    refinedResources,
    isProcessing
  };
};