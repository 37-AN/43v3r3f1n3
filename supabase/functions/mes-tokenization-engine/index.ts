import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { refinedData } = await req.json()
    console.log('Received refined data:', refinedData)
    
    // Check if refinedData exists
    if (!refinedData) {
      console.error('Missing refined data in request')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing refined data in request body' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract deviceId from either top level or metadata
    const deviceId = refinedData.deviceId || refinedData.metadata?.deviceId
    
    // Validate deviceId exists and is a valid UUID
    if (!deviceId) {
      console.error('Missing deviceId in request')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing deviceId in request body' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(deviceId)) {
      console.error('Invalid deviceId format:', deviceId)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid deviceId format. Must be a valid UUID.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Process the refined data
    const tokenizationResult = {
      success: true,
      deviceId: deviceId,
      timestamp: new Date().toISOString(),
      tokenId: crypto.randomUUID(),
      metadata: {
        source: 'mes_tokenization',
        metrics: refinedData.metrics || [],
        deviceId: deviceId
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
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})