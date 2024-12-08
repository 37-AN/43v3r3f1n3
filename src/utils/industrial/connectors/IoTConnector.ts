import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class IoTConnector {
  private deviceId: string;
  private source: string = 'iot-gateway';

  constructor(deviceId: string) {
    console.log('Initializing IoT connector for device:', deviceId);
    this.deviceId = deviceId;
  }

  async sendData() {
    try {
      // Simulate IoT sensor data
      const data = {
        source: this.source,
        deviceId: this.deviceId,
        timestamp: new Date().toISOString(),
        values: {
          temperature: Math.random() * 100,
          pressure: Math.random() * 50,
          flow_rate: Math.random() * 200
        },
        metadata: {
          unit: 'production-line-1',
          batch: `BATCH-${Math.floor(Math.random() * 1000)}`
        }
      };

      console.log('Sending data to edge function:', data);
      const { error } = await supabase.functions.invoke('industrial-data-ingest', {
        body: data
      });

      if (error) {
        console.error('Error sending IoT data:', error);
        toast.error('Failed to send IoT data');
        return;
      }

      console.log('Successfully ingested data for IoT Gateway');
    } catch (error) {
      console.error('Error in IoT data ingestion:', error);
      toast.error('IoT data ingestion error');
    }
  }
}