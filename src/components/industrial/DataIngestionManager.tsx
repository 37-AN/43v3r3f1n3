import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { SourceCard } from './sources/SourceCard';
import { initializeDevices } from './sources/SourceInitializer';
import { simulateDataIngestion } from './sources/DataSimulator';

interface Source {
  id: string;
  name: string;
  connected: boolean;
  lastUpdate: Date | null;
  deviceId: string;
}

export const DataIngestionManager = () => {
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    const setupSources = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      const initializedSources = await initializeDevices(user.id);
      setSources(initializedSources);
    };

    setupSources();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      await simulateDataIngestion(sources);
      
      setSources(prev => prev.map(source => ({
        ...source,
        connected: Math.random() > 0.3, // Simulate connection status
        lastUpdate: new Date()
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [sources]);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Industrial Data Sources</h2>
      <div className="space-y-4">
        {sources.map(source => (
          <SourceCard
            key={source.id}
            id={source.id}
            name={source.name}
            connected={source.connected}
            lastUpdate={source.lastUpdate}
          />
        ))}
      </div>
    </Card>
  );
};