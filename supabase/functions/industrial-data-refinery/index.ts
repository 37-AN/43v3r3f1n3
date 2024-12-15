import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefinedMetric {
  device_id: string;
  data_type: string;
  value: number;
  quality_score: number;
  metadata: Record<string, unknown>;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData } = await req.json();
    console.log('Received raw data:', rawData);

    // Enhanced validation
    if (!rawData) {
      throw new Error('No raw data provided');
    }

    if (!rawData.deviceId) {
      throw new Error('Device ID is required');
    }

    if (!rawData.metrics || !Array.isArray(rawData.metrics) || rawData.metrics.length === 0) {
      throw new Error('Metrics array is required and must not be empty');
    }

    // Validate each metric
    rawData.metrics.forEach((metric: any, index: number) => {
      if (!metric.metric_type) {
        throw new Error(`Metric at index ${index} is missing metric_type`);
      }
      if (typeof metric.value !== 'number') {
        throw new Error(`Metric at index ${index} has invalid value type`);
      }
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process and refine each metric
    const refinedMetrics: RefinedMetric[] = rawData.metrics.map((metric: any) => {
      const refinedValue = normalizeValue(metric.value, metric.metric_type);
      const qualityScore = calculateQualityScore(refinedValue, metric.metric_type);

      return {
        device_id: rawData.deviceId,
        data_type: metric.metric_type,
        value: refinedValue,
        quality_score: qualityScore,
        metadata: {
          ...metric.metadata,
          refined: true,
          original_value: metric.value,
          refinement_timestamp: new Date().toISOString(),
          unit: metric.unit || getDefaultUnit(metric.metric_type)
        },
        timestamp: new Date().toISOString()
      };
    });

    // Store refined data
    const { error: insertError } = await supabaseClient
      .from('refined_industrial_data')
      .insert(refinedMetrics);

    if (insertError) {
      console.error('Error storing refined data:', insertError);
      throw insertError;
    }

    console.log('Successfully refined and stored data');

    return new Response(
      JSON.stringify({ 
        success: true, 
        refinedMetrics,
        message: 'Data successfully refined and stored'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
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

function normalizeValue(value: number, metricType: string): number {
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

  const range = thresholds[metricType] || { min: -Infinity, max: Infinity };
  return Math.max(range.min, Math.min(range.max, value));
}

function calculateQualityScore(value: number, metricType: string): number {
  // Simple quality score calculation
  return 0.95; // Default high quality score
}

function getDefaultUnit(metricType: string): string {
  const unitMap: Record<string, string> = {
    temperature: '°C',
    pressure: 'bar',
    vibration: 'mm/s',
    production_rate: 'units/hr',
    downtime_minutes: 'min',
    defect_rate: '%',
    energy_consumption: 'kWh',
    machine_efficiency: '%'
  };
  return unitMap[metricType] || 'unit';
}