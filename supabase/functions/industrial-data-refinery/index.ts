import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Metric {
  metric_type: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata: {
    quality_score: number;
    source: string;
  };
}

interface RawData {
  deviceId: string;
  dataType: string;
  metrics: Metric[];
  timestamp: string;
  metadata: {
    simulation: boolean;
    source: string;
    quality_score: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData } = await req.json();
    console.log('Received raw data for refinement:', rawData);

    // Validate required fields
    if (!rawData || !rawData.deviceId || !rawData.metrics || !Array.isArray(rawData.metrics)) {
      throw new Error('Missing required fields in raw data');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process each metric
    const refinedMetrics = rawData.metrics.map((metric: Metric) => {
      try {
        // Validate metric data
        if (!metric.metric_type || typeof metric.value !== 'number') {
          console.error('Invalid metric format:', metric);
          throw new Error('Invalid metric format');
        }

        // Apply refinement based on metric type
        let refinedValue = metric.value;
        const isAnomaly = detectAnomaly(refinedValue, metric.metric_type);
        
        if (isAnomaly) {
          refinedValue = normalizeValue(refinedValue, metric.metric_type);
        }

        return {
          ...metric,
          value: refinedValue,
          metadata: {
            ...metric.metadata,
            refined: true,
            is_anomaly: isAnomaly,
            original_value: metric.value,
            refinement_timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        console.error('Error processing metric:', error);
        throw error;
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
        metadata: metric.metadata,
        timestamp: new Date().toISOString()
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

function detectAnomaly(value: number, metricType: string): boolean {
  const thresholds: Record<string, { min: number; max: number }> = {
    temperature: { min: -20, max: 120 },
    pressure: { min: 0, max: 1000 },
    vibration: { min: 0, max: 100 },
    production_rate: { min: 0, max: 1000 },
    downtime_minutes: { min: 0, max: 1440 },
    defect_rate: { min: 0, max: 100 },
    energy_consumption: { min: 0, max: 10000 },
    machine_efficiency: { min: 0, max: 100 }
  };

  const threshold = thresholds[metricType] || { min: -Infinity, max: Infinity };
  return value < threshold.min || value > threshold.max;
}

function normalizeValue(value: number, metricType: string): number {
  const thresholds = {
    temperature: { min: -20, max: 120 },
    pressure: { min: 0, max: 1000 },
    vibration: { min: 0, max: 100 },
    production_rate: { min: 0, max: 1000 },
    downtime_minutes: { min: 0, max: 1440 },
    defect_rate: { min: 0, max: 100 },
    energy_consumption: { min: 0, max: 10000 },
    machine_efficiency: { min: 0, max: 100 }
  };

  const range = thresholds[metricType as keyof typeof thresholds];
  if (!range) return value;

  return Math.max(range.min, Math.min(range.max, value));
}

function calculateQualityScore(metric: Metric & { metadata?: { is_anomaly?: boolean } }): number {
  if (metric.metadata?.is_anomaly) {
    return 0.6; // Reduced score for refined anomalous data
  }
  return 0.95; // High score for normal data
}