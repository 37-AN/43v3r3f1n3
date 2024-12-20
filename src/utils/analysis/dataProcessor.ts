import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const processAnalysisData = async (
  selectedDeviceId: string,
  preparedData: string,
  session: any
) => {
  try {
    console.log('Starting data analysis for device:', selectedDeviceId);
    
    // Validate deviceId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(selectedDeviceId)) {
      console.error('Invalid deviceId format:', selectedDeviceId);
      toast.error('Invalid device ID format');
      return null;
    }

    // Format metrics data
    const metrics = preparedData.split(' ').map((value, index) => {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        console.error('Invalid numeric value:', value);
        return null;
      }
      return {
        metric_type: `metric_${index + 1}`,
        value: numValue,
        timestamp: new Date().toISOString(),
        unit: 'unit',
        metadata: {
          quality_score: 0.95,
          source: 'plc_analysis',
          device_id: selectedDeviceId,
          simulation: true,
          owner_id: session.user.id
        }
      };
    }).filter(Boolean);

    if (metrics.length === 0) {
      console.error('No valid metrics to process');
      toast.error('No valid metrics to process');
      return null;
    }

    const requestBody = {
      rawData: {
        deviceId: selectedDeviceId,
        metrics,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'plc_analysis',
          quality_score: 0.95,
          owner_id: session.user.id,
          simulation: true
        }
      }
    };

    console.log('Sending data to industrial-data-refinery:', JSON.stringify(requestBody, null, 2));

    const { data: refinedData, error: refineryError } = await supabase.functions.invoke(
      'industrial-data-refinery',
      {
        body: requestBody
      }
    );

    if (refineryError) {
      console.error('Error in data refinement:', refineryError);
      toast.error('Failed to process data in refinery');
      return null;
    }

    console.log('Received refined data:', refinedData);
    return refinedData;
  } catch (error) {
    console.error('Error in data analysis:', error);
    toast.error('Failed to analyze PLC data');
    return null;
  }
};