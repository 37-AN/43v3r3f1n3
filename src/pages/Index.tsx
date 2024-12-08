import { SimulationControl } from "@/components/SimulationControl";
import { AIInsights } from "@/components/AIInsights";
import { ArduinoPLCDataGrid } from "@/components/ArduinoPLCDataGrid";
import { MetricsSection } from "@/components/MetricsSection";
import { useSimulationState } from "@/hooks/useSimulationState";
import { useSimulationData } from "@/hooks/useSimulationData";
import { generatePerformanceData, generateResourceData } from "@/utils/sampleDataGenerator";
import { DataAnalyzer } from "@/components/analysis/DataAnalyzer";
import { ConsoleProvider } from "@/contexts/ConsoleContext";

export default function Index() {
  const isSimulationRunning = useSimulationState();
  const chartData = useSimulationData(isSimulationRunning);
  const deviceId = 'e2fae487-1ee2-4ea2-b87f-decedb7d12a5';

  // Transform chartData into the format expected by DataAnalyzer
  const transformedData = Object.entries(chartData).reduce((acc, [key, dataPoints]) => {
    // Use the most recent value for each metric
    const latestDataPoint = dataPoints[dataPoints.length - 1];
    acc[key] = latestDataPoint?.value || 0;
    return acc;
  }, {} as Record<string, number>);

  console.log('Transformed simulation data:', transformedData);

  return (
    <ConsoleProvider>
      <div className="container mx-auto p-4 space-y-8">
        <h1 className="text-4xl font-bold mb-2">Industrial Data Simulation Platform</h1>
        <p className="text-gray-600 mb-8">
          Advanced simulation and analysis of industrial processes with AI-powered insights
        </p>

        <div className="grid grid-cols-1 gap-8">
          <SimulationControl />
          
          <MetricsSection 
            refinedPerformance={generatePerformanceData()}
            refinedResources={generateResourceData()}
          />

          <ArduinoPLCDataGrid />

          <AIInsights deviceId={deviceId} />

          <DataAnalyzer
            selectedDeviceId={deviceId}
            simulatedData={transformedData}
          />
        </div>
      </div>
    </ConsoleProvider>
  );
}