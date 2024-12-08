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
    
    // Set default date range if not provided (last 7 days for more likely data capture)
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 7);
    
    // Ensure we have the full day range
    const queryStartDate = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : defaultStartDate;
    const queryEndDate = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : new Date();
    
    console.log('Query date range:', { 
      start: queryStartDate.toISOString(), 
      end: queryEndDate.toISOString() 
    });
    
    // First fetch PLC data
    const { data: plcData, error: plcError } = await supabase
      .from('arduino_plc_data')
      .select(`
        *,
        plc_devices!inner(name)
      `)
      .gte('timestamp', queryStartDate.toISOString())
      .lte('timestamp', queryEndDate.toISOString())
      .order('timestamp', { ascending: true });

    if (plcError) {
      console.error('Error fetching PLC data:', plcError);
      toast.error('Failed to export training data');
      throw plcError;
    }

    // Log the raw query response
    console.log('PLC data query response:', {
      hasData: !!plcData,
      length: plcData?.length || 0,
      firstRecord: plcData?.[0],
      lastRecord: plcData?.[plcData?.length - 1]
    });

    if (!plcData || plcData.length === 0) {
      // Try fetching any record to verify table access
      const { data: sampleData } = await supabase
        .from('arduino_plc_data')
        .select('timestamp')
        .limit(1);
      
      console.log('Sample data check:', {
        hasSampleData: !!sampleData,
        sampleLength: sampleData?.length || 0
      });

      console.log('No PLC data found for the date range:', {
        start: queryStartDate.toISOString(),
        end: queryEndDate.toISOString()
      });
      toast.error('No data found for the specified date range');
      return;
    }

    console.log('Raw PLC data fetched:', plcData.length, 'records');
    console.log('Sample PLC data:', plcData[0]);

    // Get unique device IDs from PLC data
    const deviceIds = [...new Set(plcData.map(record => record.device_id))];
    console.log('Unique device IDs:', deviceIds);

    // Fetch insights for these devices within the same time range
    const { data: insightsData, error: insightsError } = await supabase
      .from('ai_insights')
      .select('*')
      .in('device_id', deviceIds)
      .gte('created_at', queryStartDate.toISOString())
      .lte('created_at', queryEndDate.toISOString());

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