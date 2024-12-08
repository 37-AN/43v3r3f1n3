import React from 'react';
import { OPCUAMetrics } from '@/components/opcua/OPCUAMetrics';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useOPCUAClients } from '@/hooks/useOPCUAClients';
import { DataIngestionManager } from '@/components/industrial/DataIngestionManager';
import { SimulationConfig } from '@/components/simulation/SimulationConfig';
import { SimulationDashboard } from '@/components/simulation/SimulationDashboard';

const Index = () => {
  const { simulatedData, deviceStatus } = useOPCUAClients();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader title="Industrial Data Dashboard" />
        
        <div className="grid grid-cols-1 gap-8">
          <SimulationConfig />
          <SimulationDashboard />
          <DataIngestionManager />
          
          <div className="glass-panel p-6 rounded-xl animate-fade-up">
            <OPCUAMetrics 
              simulatedData={simulatedData} 
              connectionStatus={deviceStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;