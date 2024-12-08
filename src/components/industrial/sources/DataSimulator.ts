import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MESConnector } from "@/utils/industrial/connectors/MESConnector";
import { SCADAConnector } from "@/utils/industrial/connectors/SCADAConnector";
import { IoTConnector } from "@/utils/industrial/connectors/IoTConnector";

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
        let connector;
        
        // Create appropriate connector based on source type
        if (source.name.toLowerCase().includes('mes')) {
          connector = new MESConnector(source.deviceId);
        } else if (source.name.toLowerCase().includes('scada')) {
          connector = new SCADAConnector(source.deviceId);
        } else {
          connector = new IoTConnector(source.deviceId);
        }

        await connector.sendData();
      }
    }
  } catch (error) {
    console.error('Error in data ingestion:', error);
    toast.error('Data ingestion error');
  }
};