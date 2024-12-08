import { SimulationHeader } from "@/features/simulation/components/SimulationHeader";
import { SimulationDashboard } from "@/features/simulation/components/SimulationDashboard";
import { useSimulationState } from "@/hooks/useSimulationState";
import { useSimulationData } from "@/hooks/useSimulationData";
import { useSimulationTransform } from "@/features/simulation/hooks/useSimulationTransform";
import { ConsoleProvider } from "@/contexts/ConsoleContext";
import { useEffect } from "react";
import { processAndRefineData, storeRefinedData } from "@/utils/industrial/dataProcessingService";
import { toast } from "sonner";

export default function Index() {
  const isSimulationRunning = useSimulationState();
  const chartData = useSimulationData(isSimulationRunning);
  const deviceId = 'e2fae487-1ee2-4ea2-b87f-decedb7d12a5';
  
  const transformedData = useSimulationTransform(chartData);
  console.log('Transformed simulation data:', transformedData);

  useEffect(() => {
    if (isSimulationRunning && Object.keys(transformedData).length > 0) {
      const processData = async () => {
        console.log('Processing new simulation data...');
        const refinedData = await processAndRefineData({
          deviceId,
          ...transformedData
        });

        if (refinedData) {
          const stored = await storeRefinedData(refinedData);
          if (stored) {
            toast.success('Data processed and stored successfully');
          }
        }
      };

      processData();
    }
  }, [isSimulationRunning, transformedData, deviceId]);

  return (
    <ConsoleProvider>
      <div className="container mx-auto p-4 space-y-8">
        <SimulationHeader />
        <SimulationDashboard 
          deviceId={deviceId}
          simulatedData={transformedData}
        />
      </div>
    </ConsoleProvider>
  );
}