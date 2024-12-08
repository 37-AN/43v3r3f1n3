import React from 'react';
import { PLCData } from '@/utils/plcData';
import { OPCUAMetrics } from '@/components/opcua/OPCUAMetrics';
import { AIInsights } from '@/components/AIInsights';
import { DataAnalyzer } from '@/components/analysis/DataAnalyzer';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { useOPCUAClients } from '@/hooks/useOPCUAClients';
import { useDeviceSelection } from '@/hooks/useDeviceSelection';
import { ModelTraining } from '@/components/ai/ModelTraining';
import { ModelTrainingExport } from '@/components/analysis/ModelTrainingExport';

interface IndexProps {
  plcData: PLCData | null;
  connectionStatus: { [key: string]: boolean };
}

const Index: React.FC<IndexProps> = ({ plcData, connectionStatus: plcConnectionStatus }) => {
  const { simulatedData, deviceStatus } = useOPCUAClients();
  const selectedDeviceId = useDeviceSelection();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader title="Manufacturing Dashboard" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardGrid 
            deviceStatus={deviceStatus}
            simulatedData={simulatedData}
            plcData={plcData}
          />
        </div>

        {selectedDeviceId && (
          <div className="space-y-8 animate-fade-up">
            <div className="glass-panel p-6 rounded-xl">
              <AIInsights deviceId={selectedDeviceId} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ModelTraining />
              <ModelTrainingExport />
            </div>
            
            <div className="glass-panel p-6 rounded-xl">
              <DataAnalyzer 
                selectedDeviceId={selectedDeviceId}
                simulatedData={simulatedData}
              />
            </div>
          </div>
        )}

        <div className="glass-panel p-6 rounded-xl animate-fade-up">
          <OPCUAMetrics 
            simulatedData={simulatedData} 
            connectionStatus={deviceStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;