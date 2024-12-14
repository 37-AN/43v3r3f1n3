import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData } = await req.json();
    console.log('Received raw data for refinement:', rawData);

    if (!rawData || !rawData.deviceId || !rawData.metrics) {
      throw new Error('Invalid data format');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process each metric
    const refinedMetrics = rawData.metrics.map((metric: any) => {
      try {
        // Simple anomaly detection based on statistical analysis
        const value = typeof metric.value === 'number' ? metric.value : 0;
        const isAnomaly = detectAnomaly(value, metric.metric_type);
        
        // Apply refinement if anomaly detected
        let refinedValue = value;
        if (isAnomaly) {
          refinedValue = applyRefinement(value, metric.metric_type);
        }

        return {
          ...metric,
          metadata: {
            ...metric.metadata,
            refined: true,
            is_anomaly: isAnomaly,
            original_value: value,
            refinement_timestamp: new Date().toISOString()
          },
          value: refinedValue
        };
      } catch (error) {
        console.error('Error processing metric:', error);
        return metric;
      }
    });

    // Store refined data
    const { error: insertError } = await supabaseClient
      .from('refined_industrial_data')
      .insert(refinedMetrics.map(metric => ({
        device_id: rawData.deviceId,
        data_type: metric.metric_type,
        value: metric.value,
        quality_score: calculateQualityScore(metric),
        metadata: metric.metadata
      })));

    if (insertError) {
      console.error('Error storing refined data:', insertError);
      throw insertError;
    }

    const refinedData = {
      deviceId: rawData.deviceId,
      metrics: refinedMetrics,
      metadata: {
        ...rawData.metadata,
        processed_at: new Date().toISOString(),
        source: 'industrial_data_refinery'
      }
    };

    console.log('Refined data:', refinedData);

    return new Response(
      JSON.stringify(refinedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in data refinement:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper functions for data processing
function detectAnomaly(value: number, metricType: string): boolean {
  // Implement basic anomaly detection based on metric type
  const thresholds: Record<string, { min: number; max: number }> = {
    temperature: { min: 0, max: 100 },
    pressure: { min: 0, max: 1000 },
    vibration: { min: 0, max: 50 },
    efficiency: { min: 0, max: 100 },
    energy_consumption: { min: 0, max: 1000 }
  };

  const threshold = thresholds[metricType] || { min: -Infinity, max: Infinity };
  return value < threshold.min || value > threshold.max;
}

function applyRefinement(value: number, metricType: string): number {
  // Apply appropriate refinement based on metric type
  const normalizers: Record<string, (v: number) => number> = {
    temperature: (v) => Math.max(0, Math.min(100, v)),
    pressure: (v) => Math.max(0, Math.min(1000, v)),
    vibration: (v) => Math.max(0, Math.min(50, v)),
    efficiency: (v) => Math.max(0, Math.min(100, v)),
    energy_consumption: (v) => Math.max(0, Math.min(1000, v))
  };

  return normalizers[metricType]?.(value) ?? value;
}

function calculateQualityScore(metric: any): number {
  // Calculate quality score based on metadata and refinement
  if (metric.metadata?.is_anomaly) {
    return 0.5; // Reduced score for refined anomalous data
  }
  return 0.95; // High score for normal data
}