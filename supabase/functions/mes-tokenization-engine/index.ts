import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

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
    
    if (!refinedData || !refinedData.deviceId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or missing deviceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(refinedData.deviceId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid deviceId format. Must be a valid UUID.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process the refined data
    const tokenizationResult = {
      success: true,
      deviceId: refinedData.deviceId,
      timestamp: new Date().toISOString(),
      tokenId: crypto.randomUUID(),
      metadata: {
        source: 'mes_tokenization',
        metrics: refinedData.metrics || []
      }
    }

    return new Response(
      JSON.stringify(tokenizationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in tokenization:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})