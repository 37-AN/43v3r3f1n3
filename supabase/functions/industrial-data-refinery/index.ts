import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Received request body:', body);

    if (!body.rawData) {
      console.error('No rawData field in request');
      return new Response(
        JSON.stringify({ error: 'Request must include rawData field' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { rawData } = body;

    if (!rawData.deviceId || !rawData.metrics || !Array.isArray(rawData.metrics)) {
      console.error('Invalid rawData structure:', rawData);
      return new Response(
        JSON.stringify({ error: 'Invalid rawData structure' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process the metrics and generate analysis
    const refinedData = {
      deviceId: rawData.deviceId,
      metrics: rawData.metrics.map(metric => ({
        ...metric,
        metadata: {
          ...metric.metadata,
          refined: true,
          refinement_timestamp: new Date().toISOString()
        }
      })),
      analysis: 'Data processed and refined successfully',
      severity: 'info',
      confidence: 0.95,
      metadata: {
        ...rawData.metadata,
        processed_at: new Date().toISOString(),
        source: 'industrial_data_refinery'
      }
    };

    console.log('Returning refined data:', refinedData);
    return new Response(
      JSON.stringify(refinedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing data:', error);
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
})