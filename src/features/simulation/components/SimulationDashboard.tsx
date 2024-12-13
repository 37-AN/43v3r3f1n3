import { SimulationControl } from "@/components/SimulationControl";
import { MetricsSection } from "@/components/MetricsSection";
import { ArduinoPLCDataGrid } from "@/components/ArduinoPLCDataGrid";
import { UnifiedAIInsights } from "@/components/ai/UnifiedAIInsights";
import { DataAnalyzer } from "@/components/analysis/DataAnalyzer";
import { MESDataDisplay } from "@/components/MESDataDisplay";
import { generatePerformanceData, generateResourceData } from "@/utils/sampleDataGenerator";

interface SimulationDashboardProps {
  deviceId: string;
  simulatedData: Record<string, number>;
}

export function SimulationDashboard({ deviceId, simulatedData }: SimulationDashboardProps) {
  return (
    <div className="grid grid-cols-1 gap-8">
      <SimulationControl />
      
      <UnifiedAIInsights deviceId={deviceId} />
      
      <MetricsSection 
        refinedPerformance={generatePerformanceData()}
        refinedResources={generateResourceData()}
      />

      <MESDataDisplay deviceId={deviceId} />

      <ArduinoPLCDataGrid />

      <DataAnalyzer
        selectedDeviceId={deviceId}
        simulatedData={simulatedData}
      />
    </div>
  );
}