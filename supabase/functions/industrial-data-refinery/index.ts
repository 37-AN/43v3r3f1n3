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
    console.log('Received request to industrial-data-refinery');
    
    const requestData = await req.json();
    console.log('Request data:', JSON.stringify(requestData, null, 2));

    // Validate request structure
    if (!requestData?.rawData) {
      console.error('No raw data provided in request');
      return new Response(
        JSON.stringify({
          error: 'No raw data provided',
          details: 'rawData object is required'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { rawData } = requestData;

    // Validate required fields
    if (!rawData.deviceId || !rawData.metrics || !Array.isArray(rawData.metrics)) {
      console.error('Invalid data structure:', { deviceId: rawData.deviceId, metrics: rawData.metrics });
      return new Response(
        JSON.stringify({
          error: 'Invalid data structure',
          details: 'deviceId and metrics array are required'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process metrics and calculate quality scores
    const refinedMetrics = rawData.metrics
      .filter(metric => metric.metric_type && typeof metric.value !== 'undefined')
      .map(metric => ({
        device_id: rawData.deviceId,
        data_type: metric.metric_type,
        value: metric.value,
        quality_score: metric.metadata?.quality_score || 0.95,
        timestamp: metric.timestamp || new Date().toISOString(),
        metadata: {
          ...metric.metadata,
          refined: true,
          original_value: metric.value,
          refinement_timestamp: new Date().toISOString(),
          unit: metric.unit || 'unit'
        }
      }));

    console.log('Processed metrics:', refinedMetrics.length);

    if (refinedMetrics.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('refined_industrial_data')
        .insert(refinedMetrics);

      if (insertError) {
        console.error('Error storing refined data:', insertError);
        throw insertError;
      }
    }

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