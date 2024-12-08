import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { SourceCard } from './sources/SourceCard';
import { initializeDevices } from './sources/SourceInitializer';
import { simulateDataIngestion } from './sources/DataSimulator';
import { SimulationConfig } from '../simulation/SimulationConfig';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface Source {
  id: string;
  name: string;
  connected: boolean;
  lastUpdate: Date | null;
  deviceId: string;
}

export const DataIngestionManager = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [showConfig, setShowConfig] = useState(false);

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