import { ConnectionStatus } from '@/components/dashboard/ConnectionStatus';
import { RealTimeData } from '@/components/dashboard/RealTimeData';
import { PLCData } from '@/utils/plcData';

interface DashboardGridProps {
  deviceStatus: Record<string, boolean>;
  simulatedData: Record<string, number>;
  plcData: PLCData | null;
}

export const DashboardGrid = ({ deviceStatus, simulatedData, plcData }: DashboardGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ConnectionStatus connectionStatus={deviceStatus} />
      <RealTimeData 
        simulatedData={simulatedData} 
        plcData={plcData} 
      />
    </div>
  );
};