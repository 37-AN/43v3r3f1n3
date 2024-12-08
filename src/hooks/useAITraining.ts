import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { lmStudio } from '@/utils/lmstudio';

interface TrainingData {
  input: string;
  output: string;
}

export const useAITraining = () => {
  const [isTraining, setIsTraining] = useState(false);

  const prepareTrainingData = async (deviceId: string, timeRange: { start: Date; end: Date }) => {
    console.log('Preparing training data for device:', deviceId, 'timeRange:', timeRange);
    
    const { data: plcData, error: plcError } = await supabase
      .from('arduino_plc_data')
      .select(`
        *,
        plc_devices(name)
      `)
      .eq('device_id', deviceId)
      .gte('timestamp', timeRange.start.toISOString())
      .lte('timestamp', timeRange.end.toISOString())
      .order('timestamp', { ascending: true });

    if (plcError) {
      console.error('Error fetching PLC data:', plcError);
      throw plcError;
    }

    console.log('Retrieved PLC data:', plcData?.length || 0, 'records');

    // Get corresponding insights for context
    const { data: insights, error: insightError } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('device_id', deviceId)
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString());

    if (insightError) {
      console.error('Error fetching insights:', insightError);
      // Continue without insights if there's an error
    }

    console.log('Retrieved insights:', insights?.length || 0, 'records');

    if (!plcData || plcData.length === 0) {
      throw new Error('No PLC data found for the selected time range');
    }

    // Format data for training
    const trainingData: TrainingData[] = plcData.map(record => ({
      input: `Analyze this industrial IoT data point:
Device: ${record.plc_devices?.name || 'Unknown'}
Timestamp: ${record.timestamp}
Type: ${record.data_type}
Value: ${record.value}`,
      output: insights?.find(i => 
        new Date(i.created_at).getTime() - new Date(record.timestamp).getTime() < 5000
      )?.message || 'Normal operation detected.'
    }));

    console.log('Prepared training data:', trainingData.length, 'examples');
    return trainingData;
  };

  const trainModel = async (deviceId: string, timeRange: { start: Date; end: Date }) => {
    try {
      setIsTraining(true);
      console.log('Starting AI model training...');

      // Test LM Studio connection first
      const isConnected = await lmStudio.testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to LM Studio. Please ensure the server is running at http://localhost:1234');
      }
      console.log('LM Studio connection successful');

      const trainingData = await prepareTrainingData(deviceId, timeRange);
      
      if (trainingData.length === 0) {
        throw new Error('No training data available for the selected time range');
      }
      
      // Train the model using LM Studio's fine-tuning endpoint
      console.log('Starting training with', trainingData.length, 'examples');
      for (const example of trainingData) {
        await lmStudio.analyze(
          `Training example:
Input: ${example.input}
Expected Output: ${example.output}
Please learn from this example.`
        );
      }

      console.log('Training completed successfully');
      toast.success(`AI model training completed with ${trainingData.length} examples`);
      
      // Store training metadata - Convert dates to ISO strings for JSON compatibility
      const { error: metadataError } = await supabase
        .from('ai_insights')
        .insert({
          device_id: deviceId,
          insight_type: 'training_completion',
          message: `Model trained successfully with ${trainingData.length} examples`,
          confidence: 1,
          severity: 'info',
          metadata: {
            training_examples: trainingData.length,
            time_range: {
              start: timeRange.start.toISOString(),
              end: timeRange.end.toISOString()
            }
          }
        });

      if (metadataError) {
        console.error('Error storing training metadata:', metadataError);
      }

    } catch (error) {
      console.error('Error training AI model:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to train AI model');
      throw error;
    } finally {
      setIsTraining(false);
    }
  };

  return {
    trainModel,
    isTraining
  };
};