import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataIngestionManager } from '@/components/industrial/DataIngestionManager';
import { SimulationDashboard } from '@/components/simulation/SimulationDashboard';

const Index = () => {
  // For now, we'll use a default device ID. In a real application, 
  // this would likely come from a route parameter or state management
  const defaultDeviceId = "default-device-id";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-2 py-4 space-y-4 max-w-5xl">
        <DashboardHeader title="Industrial Data Dashboard" />
        
        <div className="grid grid-cols-1 gap-4">
          <SimulationDashboard deviceId={defaultDeviceId} />
          <DataIngestionManager />
        </div>
      </div>
    </div>
  );
};

export default Index;