import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class MESConnector {
  private deviceId: string;
  private source: string = 'mes-1';

  constructor(deviceId: string) {
    console.log('Initializing MES connector for device:', deviceId);
    this.deviceId = deviceId;
  }

  async sendData() {
    try {
      // Simulate MES data
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
        console.error('Error sending MES data:', error);
        toast.error('Failed to send MES data');
        return;
      }

      console.log('Successfully ingested data for MES System');
    } catch (error) {
      console.error('Error in MES data ingestion:', error);
      toast.error('MES data ingestion error');
    }
  }
}