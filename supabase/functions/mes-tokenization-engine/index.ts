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

    // Validate request body structure
    if (!body.refinedData) {
      console.error('Missing refinedData in request body');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request',
          details: 'Request must include refinedData field'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { refinedData } = body;
    console.log('Validating refined data structure:', refinedData);

    // Validate metrics field exists and is an array
    if (!refinedData.metrics || !Array.isArray(refinedData.metrics)) {
      console.error('Invalid or missing metrics array:', refinedData.metrics);
      return new Response(
        JSON.stringify({
          error: 'Invalid data structure',
          details: 'refinedData.metrics must be an array'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Ensure metrics array is not empty
    if (refinedData.metrics.length === 0) {
      console.warn('Empty metrics array received');
      return new Response(
        JSON.stringify({
          success: true,
          processedMetrics: [],
          message: 'No metrics to process'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process metrics and generate MES tokens
    const processedMetrics = refinedData.metrics.map(metric => {
      console.log('Processing metric:', metric);
      return {
        ...metric,
        metadata: {
          ...(metric.metadata || {}), // Handle case where metadata might be undefined
          tokenized: true,
          tokenization_timestamp: new Date().toISOString(),
          process_type: 'mes_tokenization'
        }
      };
    });

    console.log('Successfully processed metrics:', processedMetrics);

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
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})