import { SimulationControl } from "@/components/SimulationControl";
import { MetricsSection } from "@/components/MetricsSection";
import { ArduinoPLCDataGrid } from "@/components/ArduinoPLCDataGrid";
import { AIInsights } from "@/components/AIInsights";
import { DataAnalyzer } from "@/components/analysis/DataAnalyzer";
import { generatePerformanceData, generateResourceData } from "@/utils/sampleDataGenerator";

interface SimulationDashboardProps {
  deviceId: string;
  simulatedData: Record<string, number>;
}

export function SimulationDashboard({ deviceId, simulatedData }: SimulationDashboardProps) {
  return (
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
        simulatedData={simulatedData}
      />
    </div>
  );
}