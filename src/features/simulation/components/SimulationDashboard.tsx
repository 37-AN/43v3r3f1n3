import { SimulationControl } from "@/components/SimulationControl";
import { MetricsSection } from "@/components/MetricsSection";
import { ArduinoPLCDataGrid } from "@/components/ArduinoPLCDataGrid";
import { UnifiedAIInsights } from "@/components/ai/UnifiedAIInsights";
import { DataAnalyzer } from "@/components/analysis/DataAnalyzer";
import { MESDataDisplay } from "@/components/MESDataDisplay";
import { DataRefinementTab } from "./DataRefinementTab";
import { generatePerformanceData, generateResourceData } from "@/utils/sampleDataGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SimulationDashboardProps {
  deviceId: string;
  simulatedData: Record<string, number>;
}

export function SimulationDashboard({ deviceId, simulatedData }: SimulationDashboardProps) {
  return (
    <div className="grid grid-cols-1 gap-8">
      <SimulationControl />
      
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="refinement">Data Refinement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="insights">
          <UnifiedAIInsights deviceId={deviceId} />
        </TabsContent>
        
        <TabsContent value="refinement">
          <DataRefinementTab deviceId={deviceId} simulatedData={simulatedData} />
        </TabsContent>
      </Tabs>
      
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