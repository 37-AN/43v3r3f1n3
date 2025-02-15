
import { SimulationDashboard } from "@/features/simulation/components/SimulationDashboard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SimulationTabProps {
  isLoading: boolean;
  selectedDeviceId: string | null;
  simulatedData: Record<string, number>;
  onRetryLoad: () => void;
}

export const SimulationTab = ({ 
  isLoading, 
  selectedDeviceId, 
  simulatedData,
  onRetryLoad 
}: SimulationTabProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading device data...</span>
      </div>
    );
  }

  if (!selectedDeviceId) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">No Device Selected</h2>
        <p className="text-gray-600 mb-4">Please add a PLC device to get started.</p>
        <Button onClick={onRetryLoad} className="mt-2">
          Retry Loading Device
        </Button>
      </div>
    );
  }

  return (
    <SimulationDashboard 
      deviceId={selectedDeviceId}
      simulatedData={simulatedData}
    />
  );
};
