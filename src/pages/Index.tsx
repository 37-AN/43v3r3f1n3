import { TokenizeDeviceDialog } from "@/components/TokenizeDeviceDialog";
import { Header } from "@/components/Header";
import { DeviceGrid } from "@/components/DeviceGrid";
import { MetricsSection } from "@/components/MetricsSection";
import { useDataProcessing } from "@/hooks/useDataProcessing";
import { useTokenizedAssets } from "@/hooks/useTokenizedAssets";
import { useUserEmail } from "@/hooks/useUserEmail";
import { SimulationControl } from "@/components/SimulationControl";
import { PLCDeviceGrid } from "@/components/PLCDeviceGrid";

export default function Index() {
  const { refinedPerformance, refinedResources, isProcessing } = useDataProcessing();
  const { tokenizedAssets, isTokenizeDialogOpen, setIsTokenizeDialogOpen, fetchTokenizedAssets } = useTokenizedAssets();
  const userEmail = useUserEmail();

  return (
    <div className="min-h-screen bg-system-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Header 
          userEmail={userEmail}
          isProcessing={isProcessing}
          onTokenizeClick={() => setIsTokenizeDialogOpen(true)}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DeviceGrid />
          </div>
          <div>
            <SimulationControl />
          </div>
        </div>
        
        <PLCDeviceGrid />
        
        <MetricsSection 
          refinedPerformance={refinedPerformance}
          refinedResources={refinedResources}
        />

        <TokenizeDeviceDialog 
          open={isTokenizeDialogOpen} 
          onOpenChange={setIsTokenizeDialogOpen}
          onSuccess={fetchTokenizedAssets}
        />
      </div>
    </div>
  );
}