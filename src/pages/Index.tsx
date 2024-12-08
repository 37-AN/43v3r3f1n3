import { ConnectionStatusBanner } from "@/components/ConnectionStatusBanner";
import { SimulationDashboard } from "@/features/simulation/components/SimulationDashboard";
import { useOPCUAClients } from "@/hooks/useOPCUAClients";
import { usePLCData } from "@/hooks/usePLCData";
import { useSession } from "@/hooks/useSession";

export default function Index() {
  const { session } = useSession();
  const { simulatedData } = useOPCUAClients();
  const { plcData } = usePLCData(!!session);

  const selectedDeviceId = "e2fae487-1ee2-4ea2-b87f-decedb7d12a5";

  return (
    <div className="container mx-auto p-4">
      <ConnectionStatusBanner />
      <SimulationDashboard 
        deviceId={selectedDeviceId}
        simulatedData={simulatedData}
      />
    </div>
  );
}