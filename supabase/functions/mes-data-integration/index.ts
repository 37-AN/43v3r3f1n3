import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { refinedData } = await req.json();
    console.log('Received refined data:', refinedData);

    if (!refinedData || !refinedData.device_id) {
      throw new Error('Invalid refined data format');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store refined data in refined_mes_data table
    const { data: storedData, error: storeError } = await supabase
      .from('refined_mes_data')
      .insert({
        device_id: refinedData.device_id,
        data_type: refinedData.data_type || 'measurement',
        value: refinedData.value,
        quality_score: refinedData.quality_score || 0.95,
        metadata: refinedData.metadata || {},
        process_parameters: refinedData.process_parameters || {},
        batch_id: refinedData.batch_id,
        production_line: refinedData.production_line
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing refined data:', storeError);
      throw storeError;
    }

    // Generate and store AI insights based on refined data
    const insight = {
      device_id: refinedData.device_id,
      insight_type: 'mes_analysis',
      message: generateInsightMessage(refinedData),
      confidence: calculateConfidence(refinedData),
      severity: determineSeverity(refinedData),
      metadata: {
        refined_data_id: storedData.id,
        analysis_timestamp: new Date().toISOString(),
        metrics: refinedData.metadata?.metrics || {}
      }
    };

    const { error: insightError } = await supabase
      .from('ai_insights')
      .insert(insight);

    if (insightError) {
      console.error('Error storing insight:', insightError);
      throw insightError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: storedData,
        message: 'Data successfully processed and stored'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in MES data integration:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateInsightMessage(data: any): string {
  const value = data.value;
  const type = data.data_type;
  const threshold = getThresholdForMetric(type);
  
  if (value > threshold.high) {
    return `High ${type} detected: ${value} exceeds normal range of ${threshold.normal}`;
  } else if (value < threshold.low) {
    return `Low ${type} detected: ${value} below normal range of ${threshold.normal}`;
  }
  return `${type} operating within normal parameters: ${value}`;
}

function calculateConfidence(data: any): number {
  return data.quality_score || 0.85;
}

function determineSeverity(data: any): string {
  const value = data.value;
  const type = data.data_type;
  const threshold = getThresholdForMetric(type);
  
  if (value > threshold.critical || value < threshold.critical_low) {
    return 'critical';
  } else if (value > threshold.high || value < threshold.low) {
    return 'warning';
  }
  return 'info';
}

function getThresholdForMetric(type: string): { low: number; high: number; critical_low: number; critical: number; normal: string } {
  const thresholds: Record<string, any> = {
    temperature: { low: 15, high: 35, critical_low: 5, critical: 45, normal: "20-30°C" },
    pressure: { low: 80, high: 120, critical_low: 70, critical: 130, normal: "90-110 PSI" },
    speed: { low: 1000, high: 3000, critical_low: 500, critical: 3500, normal: "1500-2500 RPM" },
    vibration: { low: 0.1, high: 2.0, critical_low: 0, critical: 3.0, normal: "0.5-1.5 mm/s" },
    default: { low: 0, high: 100, critical_low: -10, critical: 110, normal: "0-100" }
  };
  
  return thresholds[type] || thresholds.default;
}