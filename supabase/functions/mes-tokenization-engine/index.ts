import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { refinedData } = await req.json()
    console.log('Received refined data:', refinedData)

    if (!refinedData || typeof refinedData !== 'object') {
      console.error('Missing or invalid refined data:', refinedData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing or invalid refined data in request body' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { deviceId, metrics, metadata } = refinedData

    // Validate deviceId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!deviceId || !uuidRegex.test(deviceId)) {
      console.error('Invalid deviceId in refined data:', deviceId)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid deviceId in refined data' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process the tokenization
    const tokenizationResult = {
      success: true,
      deviceId,
      timestamp: new Date().toISOString(),
      tokenId: crypto.randomUUID(),
      metadata: {
        source: 'mes_tokenization',
        metrics,
        device_id: deviceId,
        owner_id: metadata?.owner_id,
        processed_at: new Date().toISOString()
      }
    }

    console.log('Tokenization result:', tokenizationResult)
    return new Response(
      JSON.stringify(tokenizationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in tokenization:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})