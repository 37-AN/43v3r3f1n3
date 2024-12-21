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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse and validate request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Received request data:', JSON.stringify(requestData, null, 2));
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body', 
          details: 'Request body must be valid JSON' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate request structure
    if (!requestData.rawData) {
      console.error('Missing rawData object');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format', 
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
    if (!rawData.deviceId || !Array.isArray(rawData.metrics)) {
      console.error('Invalid rawData structure:', rawData);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid rawData format', 
          details: 'rawData must contain deviceId and metrics array' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing metrics for device:', rawData.deviceId);

    // Process metrics and calculate quality scores
    const refinedMetrics = rawData.metrics
      .filter((metric: any) => metric.metric_type && typeof metric.value !== 'undefined')
      .map((metric: any) => ({
        device_id: rawData.deviceId,
        data_type: metric.metric_type,
        value: Number(metric.value),
        quality_score: metric.metadata?.quality_score || 0.95,
        timestamp: metric.timestamp || new Date().toISOString(),
        metadata: {
          ...metric.metadata,
          source: 'industrial-data-refinery',
          processed_at: new Date().toISOString()
        }
      }));

    console.log('Refined metrics:', refinedMetrics);

    if (refinedMetrics.length > 0) {
      // Store refined data
      const { error: insertError } = await supabaseClient
        .from('refined_industrial_data')
        .insert(refinedMetrics);

      if (insertError) {
        console.error('Error storing refined data:', insertError);
        throw insertError;
      }

      console.log('Successfully stored refined data');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data refined and stored successfully',
        metrics_processed: refinedMetrics.length,
        refined_metrics: refinedMetrics
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in industrial-data-refinery:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});