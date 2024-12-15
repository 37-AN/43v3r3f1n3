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

    // Validate request body
    if (!body.refinedData) {
      console.error('No refined data provided');
      return new Response(
        JSON.stringify({ 
          error: 'No refined data provided',
          details: 'Request must include refinedData field'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { refinedData } = body;
    console.log('Processing refined data:', refinedData);

    // Validate metrics array
    if (!Array.isArray(refinedData.metrics)) {
      console.error('Invalid metrics format:', refinedData.metrics);
      return new Response(
        JSON.stringify({
          error: 'Invalid metrics format',
          details: 'Metrics must be an array'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process metrics and generate MES tokens
    const processedMetrics = refinedData.metrics.map(metric => ({
      ...metric,
      metadata: {
        ...metric.metadata,
        tokenized: true,
        tokenization_timestamp: new Date().toISOString(),
        process_type: 'mes_tokenization'
      }
    }));

    console.log('Processed metrics:', processedMetrics);

    return new Response(
      JSON.stringify({
        success: true,
        processedMetrics,
        message: 'Data successfully tokenized'
      }),
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