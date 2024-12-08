import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface DataSourceStatus {
  id: string;
  name: string;
  connected: boolean;
  lastUpdate: Date | null;
}

export const DataIngestionManager = () => {
  const [sources, setSources] = useState<DataSourceStatus[]>([
    { id: 'mes-1', name: 'MES System', connected: false, lastUpdate: null },
    { id: 'scada-1', name: 'SCADA Controller', connected: false, lastUpdate: null },
    { id: 'iot-gateway', name: 'IoT Gateway', connected: false, lastUpdate: null }
  ]);

  useEffect(() => {
    const simulateDataIngestion = async () => {
      try {
        // Simulate data from different sources
        for (const source of sources) {
          if (Math.random() > 0.3) { // 70% chance of receiving data
            const mockData = {
              source: source.id,
              deviceId: `${source.id}-device-1`,
              timestamp: new Date().toISOString(),
              values: {
                temperature: Math.random() * 100,
                pressure: Math.random() * 50,
                flow_rate: Math.random() * 200
              },
              metadata: {
                unit: 'production-line-1',
                batch: 'BATCH-' + Math.floor(Math.random() * 1000)
              }
            };

            const { error } = await supabase.functions.invoke('industrial-data-ingest', {
              body: mockData
            });

            if (error) {
              console.error(`Error ingesting data from ${source.name}:`, error);
              toast.error(`Failed to ingest data from ${source.name}`);
              continue;
            }

            setSources(prev => prev.map(s => 
              s.id === source.id 
                ? { ...s, connected: true, lastUpdate: new Date() }
                : s
            ));
          }
        }
      } catch (error) {
        console.error('Error in data ingestion:', error);
        toast.error('Data ingestion error');
      }
    };

    // Simulate real-time data ingestion every 5 seconds
    const interval = setInterval(simulateDataIngestion, 5000);
    return () => clearInterval(interval);
  }, [sources]);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Industrial Data Sources</h2>
      <div className="space-y-4">
        {sources.map(source => (
          <div key={source.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${source.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <div>
                <h3 className="font-medium">{source.name}</h3>
                <p className="text-sm text-gray-500">
                  {source.lastUpdate 
                    ? `Last update: ${source.lastUpdate.toLocaleTimeString()}`
                    : 'No data received yet'}
                </p>
              </div>
            </div>
            <Badge variant={source.connected ? "success" : "destructive"}>
              {source.connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};