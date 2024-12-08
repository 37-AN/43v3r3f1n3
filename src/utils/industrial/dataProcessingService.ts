import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProcessedData {
  deviceId: string;
  dataType: string;
  value: number;
  qualityScore: number;
  metadata: Record<string, any>;
}

export const processAndRefineData = async (rawData: any): Promise<ProcessedData | null> => {
  try {
    console.log('Processing raw industrial data:', rawData);
    
    // Call the AI analysis edge function
    const { data: refinedData, error: analysisError } = await supabase.functions.invoke(
      'industrial-data-refinery',
      {
        body: { rawData }
      }
    );

    if (analysisError) {
      console.error('Error in data refinement:', analysisError);
      toast.error('Failed to process industrial data');
      return null;
    }

    console.log('Data refined successfully:', refinedData);
    return refinedData;
  } catch (error) {
    console.error('Error processing data:', error);
    toast.error('Error in data processing pipeline');
    return null;
  }
};

export const storeRefinedData = async (processedData: ProcessedData) => {
  try {
    console.log('Storing refined data:', processedData);
    
    const { error } = await supabase
      .from('refined_industrial_data')
      .insert({
        device_id: processedData.deviceId,
        data_type: processedData.dataType,
        value: processedData.value,
        quality_score: processedData.qualityScore,
        metadata: processedData.metadata
      });

    if (error) {
      console.error('Error storing refined data:', error);
      toast.error('Failed to store refined data');
      return false;
    }

    // After storing refined data, send it to MES engine for tokenization
    const { error: mesError } = await supabase.functions.invoke(
      'mes-tokenization-engine',
      {
        body: {
          refinedData: processedData,
          timestamp: new Date().toISOString()
        }
      }
    );

    if (mesError) {
      console.error('Error sending data to MES engine:', mesError);
      toast.error('Failed to process in MES engine');
      return false;
    }

    console.log('Data successfully processed and tokenized');
    toast.success('Data processed and tokenized successfully');
    return true;
  } catch (error) {
    console.error('Error in data processing pipeline:', error);
    toast.error('Failed to process data');
    return false;
  }
};