import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Source {
  id: string;
  name: string;
  deviceId: string;
}

export const simulateDataIngestion = async (sources: Source[]) => {
  try {
    console.log('Starting data ingestion simulation');
    
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
      }
    }
  } catch (error) {
    console.error('Error in data ingestion:', error);
    toast.error('Data ingestion error');
  }
};