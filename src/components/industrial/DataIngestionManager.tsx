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
  deviceId: string;
}

export const DataIngestionManager = () => {
  const [sources, setSources] = useState<DataSourceStatus[]>([]);

  useEffect(() => {
    const initializeDevices = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        toast.error('Authentication required');
        return;
      }

      // Define our data sources
      const initialSources = [
        { 
          id: 'mes-1', 
          name: 'MES System',
          deviceId: '', // Will be set after device creation
          connected: false,
          lastUpdate: null
        },
        { 
          id: 'scada-1', 
          name: 'SCADA Controller',
          deviceId: '',
          connected: false,
          lastUpdate: null
        },
        { 
          id: 'iot-gateway', 
          name: 'IoT Gateway',
          deviceId: '',
          connected: false,
          lastUpdate: null
        }
      ];

      // Create or get devices for each source
      const updatedSources = await Promise.all(
        initialSources.map(async (source) => {
          try {
            // Check if device already exists
            const { data: existingDevices, error: fetchError } = await supabase
              .from('plc_devices')
              .select('id')
              .eq('name', source.name)
              .eq('owner_id', user.id)
              .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
              console.error(`Error fetching device for ${source.name}:`, fetchError);
              throw fetchError;
            }

            if (existingDevices) {
              console.log(`Device exists for ${source.name}:`, existingDevices.id);
              return { ...source, deviceId: existingDevices.id };
            }

            // Create new device if it doesn't exist
            const { data: newDevice, error: createError } = await supabase
              .from('plc_devices')
              .insert({
                name: source.name,
                description: `Data source for ${source.name}`,
                owner_id: user.id,
                is_active: true,
                protocol: 'industrial'
              })
              .select()
              .single();

            if (createError) {
              console.error(`Error creating device for ${source.name}:`, createError);
              throw createError;
            }

            console.log(`Created new device for ${source.name}:`, newDevice.id);
            return { ...source, deviceId: newDevice.id };
          } catch (error) {
            console.error(`Error setting up device for ${source.name}:`, error);
            toast.error(`Failed to setup ${source.name}`);
            return source;
          }
        })
      );

      setSources(updatedSources);
    };

    initializeDevices();
  }, []);

  useEffect(() => {
    const simulateDataIngestion = async () => {
      try {
        console.log('Starting data ingestion simulation');
        // Simulate data from different sources
        for (const source of sources) {
          if (!source.deviceId) {
            console.log(`Skipping ${source.name} - no device ID`);
            continue;
          }

          if (Math.random() > 0.3) { // 70% chance of receiving data
            const mockData = {
              source: source.id,
              deviceId: source.deviceId,
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

            console.log('Sending data to edge function:', mockData);
            const { error } = await supabase.functions.invoke('industrial-data-ingest', {
              body: mockData
            });

            if (error) {
              console.error(`Error ingesting data from ${source.name}:`, error);
              toast.error(`Failed to ingest data from ${source.name}`);
              continue;
            }

            console.log(`Successfully ingested data for ${source.name}`);
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