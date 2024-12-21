import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log('Processing raw industrial data:', requestData);

    if (!requestData?.rawData?.metrics) {
      throw new Error('Invalid request format: metrics array is required');
    }

    const { rawData } = requestData;
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process and refine the data
    const refinedMetrics = rawData.metrics.map((metric: any) => {
      // Simple data quality assessment based on value ranges
      const qualityScore = calculateQualityScore(metric);

      return {
        device_id: rawData.deviceId,
        data_type: metric.metric_type,
        value: metric.value,
        quality_score: qualityScore,
        timestamp: metric.timestamp,
        metadata: {
          ...metric.metadata,
          refined: true,
          refinement_timestamp: new Date().toISOString(),
          original_value: metric.value,
          unit: metric.unit
        }
      };
    });

    // Store refined data
    const { error: storageError } = await supabase
      .from('refined_industrial_data')
      .insert(refinedMetrics);

    if (storageError) {
      console.error('Error storing refined data:', storageError);
      throw storageError;
    }

    // Store insights
    const { error: insightError } = await supabase
      .from('ai_insights')
      .insert({
        device_id: rawData.deviceId,
        insight_type: 'data_refinement',
        message: generateInsightMessage(refinedMetrics),
        confidence: 0.85,
        severity: 'info',
        metadata: {
          metrics_processed: refinedMetrics.length,
          average_quality_score: refinedMetrics.reduce((acc: number, m: any) => acc + m.quality_score, 0) / refinedMetrics.length,
          timestamp: new Date().toISOString()
        }
      });

    if (insightError) {
      console.error('Error storing insight:', insightError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        refinedMetrics,
        message: 'Data successfully refined and analyzed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in data refinement:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Error occurred during data refinement process'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function calculateQualityScore(metric: any): number {
  const { value, metric_type } = metric;
  
  // Define expected ranges for different metric types
  const ranges: Record<string, { min: number; max: number }> = {
    temperature: { min: -50, max: 150 },
    pressure: { min: 0, max: 1000 },
    vibration: { min: 0, max: 100 },
    production_rate: { min: 0, max: 1000 },
    downtime_minutes: { min: 0, max: 1440 },
    defect_rate: { min: 0, max: 100 },
    energy_consumption: { min: 0, max: 10000 },
    machine_efficiency: { min: 0, max: 100 }
  };

  const range = ranges[metric_type];
  if (!range) return 0.8; // Default score for unknown metrics

  // Calculate score based on whether value is within expected range
  if (value >= range.min && value <= range.max) {
    return 0.95;
  } else if (value < range.min * 0.5 || value > range.max * 1.5) {
    return 0.6;
  } else {
    return 0.8;
  }
}

function generateInsightMessage(metrics: any[]): string {
  const anomalies = metrics.filter(m => m.quality_score < 0.8);
  const highQuality = metrics.filter(m => m.quality_score >= 0.9);
  
  let message = `Processed ${metrics.length} metrics. `;
  
  if (anomalies.length > 0) {
    message += `Found ${anomalies.length} potential anomalies. `;
  }
  
  if (highQuality.length > 0) {
    message += `${highQuality.length} metrics show high quality data. `;
  }
  
  return message;
}