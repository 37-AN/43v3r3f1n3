import { useState, useEffect } from "react";
import { initializeAIPipelines, processIndustrialData } from "@/utils/aiPipeline";
import { ModbusRegisterData } from "@/types/modbus";
import { performanceData, resourceData } from "@/utils/sampleDataGenerator";

export const useDataProcessing = () => {
  const [refinedPerformance, setRefinedPerformance] = useState<ModbusRegisterData[]>([]);
  const [refinedResources, setRefinedResources] = useState<ModbusRegisterData[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);

  const processData = async () => {
    try {
      console.log("Initializing AI pipelines and processing data");
      await initializeAIPipelines();
      
      const performanceValues = performanceData.map(d => d.value);
      const resourceValues = resourceData.map(d => d.value);

      const [performanceResults, resourceResults] = await Promise.all([
        processIndustrialData(performanceValues, { dataType: 'performance' }),
        processIndustrialData(resourceValues, { dataType: 'resource' }),
      ]);

      setRefinedPerformance(performanceResults.cleanedData.map((value, index) => ({
        timestamp: performanceData[index].timestamp,
        value,
        registerType: 'holding',
        address: 1
      })));
      
      setRefinedResources(resourceResults.cleanedData.map((value, index) => ({
        timestamp: resourceData[index].timestamp,
        value,
        registerType: 'input',
        address: 2
      })));

      console.log("Data processing completed successfully", {
        performanceAnomalies: performanceResults.anomalies.length,
        resourceAnomalies: resourceResults.anomalies.length
      });
    } catch (error) {
      console.error("Error processing data:", error);
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