import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { SourceCard } from './sources/SourceCard';
import { initializeDevices } from './sources/SourceInitializer';
import { simulateDataIngestion } from './sources/DataSimulator';
import { SimulationConfig } from '../simulation/SimulationConfig';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Source {
  id: string;
  name: string;
  connected: boolean;
  lastUpdate: Date | null;
  deviceId: string;
}

interface RealTimeData {
  deviceId: string;
  dataType: string;
  value: number;
  timestamp: string;
}

export const DataIngestionManager = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [realTimeData, setRealTimeData] = useState<RealTimeData[]>([]);

  useEffect(() => {
    const setupSources = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      const initializedSources = await initializeDevices(user.id);
      console.log('Initialized sources:', initializedSources);
      setSources(initializedSources);
    };

    setupSources();
  }, []);

  useEffect(() => {
    // Subscribe to real-time updates
    console.log('Setting up real-time subscription...');
    const subscription = supabase
      .channel('arduino_plc_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arduino_plc_data'
        },
        (payload) => {
          console.log('Received real-time data:', payload);
          const newData = {
            deviceId: payload.new.device_id,
            dataType: payload.new.data_type,
            value: payload.new.value,
            timestamp: payload.new.timestamp
          };
          
          setRealTimeData(prev => [...prev.slice(-9), newData]);
          toast.success(`New data received: ${payload.new.data_type}`);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      await simulateDataIngestion(sources);
      
      setSources(prev => prev.map(source => ({
        ...source,
        connected: Math.random() > 0.3,
        lastUpdate: new Date()
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [sources]);

  const handleConfigureSource = (source: Source) => {
    console.log('Configuring source:', source);
    setSelectedSource(source);
    setShowConfig(true);
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Industrial Data Sources</h2>
      <div className="space-y-3">
        {sources.map(source => (
          <SourceCard
            key={source.id}
            id={source.id}
            name={source.name}
            connected={source.connected}
            lastUpdate={source.lastUpdate}
            onConfigure={() => handleConfigureSource(source)}
          />
        ))}
      </div>

      {realTimeData.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-medium mb-2">Real-time Updates</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {realTimeData.map((data, index) => (
              <div 
                key={index}
                className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center"
              >
                <span className="text-sm font-medium">{data.dataType}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {data.value.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedSource && (
            <SimulationConfig
              deviceId={selectedSource.deviceId}
              onClose={() => setShowConfig(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};