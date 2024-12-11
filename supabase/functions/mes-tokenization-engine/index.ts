import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function validateRefinedData(refinedData: any) {
  if (!refinedData || typeof refinedData !== 'object') {
    return { isValid: false, error: 'Refined data must be an object' };
  }

  const { deviceId, metrics, metadata } = refinedData;

  // Validate deviceId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!deviceId || !uuidRegex.test(deviceId)) {
    return { isValid: false, error: 'Invalid deviceId format' };
  }

  // Validate metrics
  if (!Array.isArray(metrics)) {
    return { isValid: false, error: 'Metrics must be an array' };
  }

  // Validate metadata
  if (!metadata || typeof metadata !== 'object') {
    return { isValid: false, error: 'Invalid metadata format' };
  }

  return { isValid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { refinedData } = await req.json();
    console.log('Received refined data:', refinedData);

    const validation = validateRefinedData(refinedData);
    if (!validation.isValid) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the tokenization
    const tokenizationResult = {
      success: true,
      deviceId: refinedData.deviceId,
      timestamp: new Date().toISOString(),
      tokenId: crypto.randomUUID(),
      metadata: {
        source: 'mes_tokenization',
        metrics: refinedData.metrics,
        device_id: refinedData.deviceId,
        owner_id: refinedData.metadata?.owner_id,
        processed_at: new Date().toISOString()
      }
    };

    console.log('Tokenization result:', tokenizationResult);
    return new Response(
      JSON.stringify(tokenizationResult),
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})