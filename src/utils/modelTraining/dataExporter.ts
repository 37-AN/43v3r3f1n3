import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrainingDataPoint {
  timestamp: string;
  deviceId: string;
  values: Record<string, number>;
  insights: Array<{
    message: string;
    confidence: number;
    severity: string;
  }>;
}

export async function exportTrainingData(startDate?: Date, endDate?: Date) {
  try {
    console.log('Starting training data export...');
    
    // Fetch PLC data with corresponding insights
    const { data: plcData, error: plcError } = await supabase
      .from('arduino_plc_data')
      .select(`
        *,
        plc_devices!inner(name),
        ai_insights!inner(
          message,
          confidence,
          severity
        )
      `)
      .gte('timestamp', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('timestamp', endDate?.toISOString() || new Date().toISOString())
      .order('timestamp', { ascending: true });

    if (plcError) {
      console.error('Error fetching training data:', plcError);
      toast.error('Failed to export training data');
      throw plcError;
    }

    console.log('Raw data fetched:', plcData?.length, 'records');

    // Group data by timestamp and device
    const groupedData = new Map<string, TrainingDataPoint>();
    
    plcData?.forEach(record => {
      const key = `${record.timestamp}_${record.device_id}`;
      
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          timestamp: record.timestamp,
          deviceId: record.device_id,
          values: {},
          insights: []
        });
      }
      
      const dataPoint = groupedData.get(key)!;
      dataPoint.values[record.data_type] = record.value;
      
      if (record.ai_insights) {
        dataPoint.insights.push({
          message: record.ai_insights.message,
          confidence: record.ai_insights.confidence,
          severity: record.ai_insights.severity
        });
      }
    });

    const trainingData = Array.from(groupedData.values());
    console.log('Processed training data points:', trainingData.length);

    // Format data for export
    const formattedData = trainingData.map(point => ({
      input: {
        timestamp: point.timestamp,
        measurements: point.values,
      },
      output: {
        insights: point.insights.filter(i => i.confidence > 0.7)
      }
    }));

    // Export as JSON
    const blob = new Blob([JSON.stringify(formattedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `plc-training-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Training data export completed successfully');
    toast.success('Training data exported successfully');
    
    return formattedData;
  } catch (error) {
    console.error('Error in data export:', error);
    toast.error('Failed to export training data');
    throw error;
  }
}