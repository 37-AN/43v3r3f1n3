import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataIngestionManager } from '@/components/industrial/DataIngestionManager';
import { SimulationDashboard } from '@/components/simulation/SimulationDashboard';
import { useDeviceSelection } from '@/hooks/useDeviceSelection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const selectedDeviceId = useDeviceSelection();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-2 py-4 space-y-4 max-w-5xl">
        <div className="flex justify-between items-center">
          <DashboardHeader title="Industrial Data Dashboard" />
          <div className="space-x-4">
            <Button
              onClick={() => navigate('/tokenized-assets')}
              variant="outline"
            >
              View Tokenized Assets
            </Button>
            <Button
              onClick={() => navigate('/asset-management')}
              variant="default"
            >
              Asset Management
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {selectedDeviceId ? (
            <SimulationDashboard deviceId={selectedDeviceId} />
          ) : (
            <div className="text-center p-4">Loading device...</div>
          )}
          <DataIngestionManager />
        </div>
      </div>
    </div>
  );
};

export default Index;