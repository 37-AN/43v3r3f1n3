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

const Index: React.FC<IndexProps> = ({ plcData, connectionStatus }) => {
  const { simulatedData, deviceStatus } = useOPCUAClients();
  const selectedDeviceId = useDeviceSelection();

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-up">
      <DashboardHeader title="Manufacturing Dashboard" />
      
      <DashboardGrid 
        deviceStatus={deviceStatus}
        simulatedData={simulatedData}
        plcData={plcData}
      />

      {selectedDeviceId && (
        <>
          <AIInsights deviceId={selectedDeviceId} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModelTraining />
            <ModelTrainingExport />
          </div>
          <DataAnalyzer 
            selectedDeviceId={selectedDeviceId}
            simulatedData={simulatedData}
          />
        </>
      )}

      <OPCUAMetrics simulatedData={simulatedData} />
    </div>
  );
};

export default Index;