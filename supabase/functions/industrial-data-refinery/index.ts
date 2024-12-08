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
    console.log('Received raw data:', rawData);

    // Validate required fields
    if (!rawData || typeof rawData !== 'object') {
      console.error('Raw data is missing or not an object');
      throw new Error('Invalid or missing raw data structure');
    }

    if (!rawData.deviceId || !rawData.values || !Array.isArray(rawData.values)) {
      console.error('Missing required fields in raw data:', rawData);
      throw new Error('Missing required fields in raw data');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate basic statistics
    const values = rawData.values.filter(value => typeof value === 'number' && !isNaN(value));
    if (values.length === 0) {
      throw new Error('No valid numerical values found');
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    );

    // Prepare refined data
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

    // Store refined data
    const { error: insertError } = await supabaseClient
      .from('refined_industrial_data')
      .insert(refinedData);

    if (insertError) {
      console.error('Error storing refined data:', insertError);
      throw insertError;
    }

    // Generate analysis based on the refined data
    const analysis = {
      deviceId: rawData.deviceId,
      analysis: `Processed value: ${values[0].toFixed(2)} (mean: ${mean.toFixed(2)})`,
      severity: Math.abs(values[0] - mean) > stdDev * 2 ? 'warning' : 'info',
      confidence: 0.95,
      timestamp: refinedData.timestamp
    };

    console.log('Returning analysis:', analysis);

    return new Response(
      JSON.stringify(analysis),
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
        error: error.message || 'Error processing data'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});