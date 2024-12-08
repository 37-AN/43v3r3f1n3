import React from 'react';
import { OPCUAMetrics } from '@/components/opcua/OPCUAMetrics';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useOPCUAClients } from '@/hooks/useOPCUAClients';

const Index = () => {
  const { simulatedData, deviceStatus } = useOPCUAClients();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader title="OPC UA Dashboard" />
        
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