import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { refinedData } = await req.json();
    console.log('Received refined data:', refinedData);

    if (!refinedData) {
      console.error('No refinedData field in request');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Request must include refinedData field' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!refinedData.deviceId || !refinedData.metrics) {
      console.error('Invalid refinedData structure:', refinedData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid refinedData structure' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process the metrics and generate MES tokens
    const mesResult = {
      success: true,
      deviceId: refinedData.deviceId,
      tokenizedMetrics: refinedData.metrics.map(metric => ({
        ...metric,
        tokenId: crypto.randomUUID(),
        tokenizedAt: new Date().toISOString()
      })),
      metadata: {
        ...refinedData.metadata,
        tokenization_timestamp: new Date().toISOString(),
        source: 'mes_tokenization_engine'
      }
    };

    console.log('Returning MES result:', mesResult);
    return new Response(
      JSON.stringify(mesResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in tokenization:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
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