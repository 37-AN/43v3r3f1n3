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
    console.log('Date range:', { startDate, endDate });
    
    // First fetch PLC data
    const { data: plcData, error: plcError } = await supabase
      .from('arduino_plc_data')
      .select(`
        *,
        plc_devices!inner(name)
      `)
      .gte('timestamp', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('timestamp', endDate?.toISOString() || new Date().toISOString())
      .order('timestamp', { ascending: true });

    if (plcError) {
      console.error('Error fetching PLC data:', plcError);
      toast.error('Failed to export training data');
      throw plcError;
    }

    if (!plcData || plcData.length === 0) {
      console.log('No PLC data found for the specified date range');
      toast.error('No data found for the specified date range');
      return;
    }

    console.log('Raw PLC data fetched:', plcData.length, 'records');

    // Get unique device IDs from PLC data
    const deviceIds = [...new Set(plcData.map(record => record.device_id))];

    // Fetch insights for these devices within the same time range
    const { data: insightsData, error: insightsError } = await supabase
      .from('ai_insights')
      .select('*')
      .in('device_id', deviceIds)
      .gte('created_at', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', endDate?.toISOString() || new Date().toISOString());

    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
      // Continue without insights if there's an error
      console.log('Continuing without insights data');
    }

    console.log('Insights data fetched:', insightsData?.length || 0, 'records');

    // Group insights by device ID and timestamp
    const insightsByDevice = (insightsData || []).reduce((acc, insight) => {
      const key = insight.device_id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(insight);
      return acc;
    }, {} as Record<string, any[]>);

    // Group data by timestamp and device
    const groupedData = new Map<string, TrainingDataPoint>();
    
    plcData.forEach(record => {
      const key = `${record.timestamp}_${record.device_id}`;
      
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          timestamp: record.timestamp,
          deviceId: record.device_id,
          values: {},
          insights: insightsByDevice[record.device_id] || []
        });
      }
      
      const dataPoint = groupedData.get(key)!;
      dataPoint.values[record.data_type] = record.value;
    });

    const trainingData = Array.from(groupedData.values());
    console.log('Processed training data points:', trainingData.length);

    // Format data specifically for LLM training
    const formattedData = trainingData.map(point => ({
      instruction: "Analyze this industrial IoT data and provide insights:",
      input: `Timestamp: ${point.timestamp}
Device Measurements: ${Object.entries(point.values)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')}`,
      output: point.insights
        .filter(i => i.confidence > 0.7)
        .map(i => i.message)
        .join('\n')
    }));

    if (formattedData.length === 0) {
      console.log('No training data generated after processing');
      toast.error('No valid training data found');
      return;
    }

    console.log('Formatted training examples:', formattedData.length);
    console.log('Sample formatted data:', formattedData[0]);

    // Export as JSONL (one JSON object per line, common format for LLM training)
    const jsonlContent = formattedData
      .map(item => JSON.stringify(item))
      .join('\n');

    // Create blob and trigger download
    const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `plc-training-data-${new Date().toISOString().split('T')[0]}.jsonl`;
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