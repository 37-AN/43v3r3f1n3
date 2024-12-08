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
    const { rawData } = await req.json();
    console.log('Received raw data for refinement:', rawData);

    // Validate input data
    if (!rawData || !rawData.deviceId || !rawData.values || !Array.isArray(rawData.values)) {
      console.error('Invalid or missing raw data structure:', rawData);
      throw new Error('Invalid or missing raw data structure');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Basic statistical analysis
    const values = rawData.values.filter(value => typeof value === 'number' && !isNaN(value));
    if (values.length === 0) {
      throw new Error('No valid numerical values found in raw data');
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    );

    // Process and refine the data
    const refinedData = {
      device_id: rawData.deviceId,
      data_type: rawData.dataType || 'measurement',
      value: values[0],
      quality_score: 0.95,
      timestamp: rawData.timestamp || new Date().toISOString(),
      metadata: {
        mean,
        stdDev,
        originalValue: values[0],
        source: 'ai_refinery',
        owner_id: rawData.metadata?.owner_id
      }
    };

    console.log('Storing refined data:', refinedData);

    // Store the refined data
    const { error: insertError } = await supabaseClient
      .from('refined_industrial_data')
      .insert(refinedData);

    if (insertError) {
      console.error('Error storing refined data:', insertError);
      throw insertError;
    }

    console.log('Successfully stored refined data');

    // Return the processed data
    return new Response(
      JSON.stringify({
        ...refinedData,
        deviceId: rawData.deviceId,
        analysis: `Processed value: ${values[0]} (mean: ${mean.toFixed(2)})`,
        severity: 'info',
        confidence: 0.95
      }),
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