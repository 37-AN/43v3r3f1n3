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

    // Handle health check requests
    if (body.action === 'health-check') {
      return new Response(
        JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate request body for tokenization requests
    if (!body.refinedData) {
      console.error('No refinedData field in request');
      return new Response(
        JSON.stringify({ success: false, error: 'Request must include refinedData field' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { refinedData } = body;

    // Process the metrics and generate tokenized assets
    const tokenizedMetrics = {
      deviceId: refinedData.deviceId,
      metrics: refinedData.metrics.map((metric: any) => ({
        ...metric,
        metadata: {
          ...metric.metadata,
          tokenized: true,
          tokenization_timestamp: new Date().toISOString()
        }
      })),
      analysis: refinedData.analysis || 'No analysis available',
      timestamp: new Date().toISOString(),
      metadata: {
        ...refinedData.metadata,
        tokenized: true,
        engine_version: '1.0.0'
      }
    };

    console.log('Processed tokenized metrics:', tokenizedMetrics);
    
    return new Response(
      JSON.stringify(tokenizedMetrics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
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