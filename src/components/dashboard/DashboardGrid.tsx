import { Card } from "@/components/ui/card";
import { PLCData } from '@/utils/plcData';

interface DashboardGridProps {
  deviceStatus: Record<string, boolean>;
  simulatedData: Record<string, number>;
  plcData: PLCData | null;
}

export const DashboardGrid = ({ deviceStatus, simulatedData, plcData }: DashboardGridProps) => {
  return (
    <>
      <Card className="p-6 glass-panel hover:shadow-lg transition-shadow duration-200">
        <h2 className="text-xl font-semibold mb-4">Device Status</h2>
        <div className="space-y-3">
          {Object.entries(deviceStatus).map(([deviceId, status]) => (
            <div key={deviceId} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm font-medium">Device ({deviceId})</span>
              <div className="flex items-center gap-2">
                <div className={`status-indicator ${status ? 'active' : 'error'}`} />
                <span className={`text-sm ${status ? 'text-green-600' : 'text-red-500'}`}>
                  {status ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 glass-panel hover:shadow-lg transition-shadow duration-200">
        <h2 className="text-xl font-semibold mb-4">Real-time Metrics</h2>
        <div className="space-y-3">
          {Object.entries(simulatedData).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm font-medium capitalize">{key}</span>
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                {value.toFixed(2)}
              </span>
            </div>
          ))}
          {plcData && Object.entries(plcData).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm font-medium">{key}</span>
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                {value !== undefined && value !== null ? String(value) : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};