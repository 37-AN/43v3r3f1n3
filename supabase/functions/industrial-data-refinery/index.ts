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
    const { rawData } = await req.json()
    console.log('Received raw data:', rawData)
    
    if (!rawData || typeof rawData !== 'object') {
      console.error('Invalid raw data format')
      return new Response(
        JSON.stringify({ error: 'Invalid raw data format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const deviceId = rawData.deviceId
    console.log('Processing data for device:', deviceId)

    // Validate deviceId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!deviceId || !uuidRegex.test(deviceId)) {
      console.error('Invalid or missing deviceId:', deviceId)
      return new Response(
        JSON.stringify({ error: 'Invalid or missing deviceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate metrics array
    if (!Array.isArray(rawData.metrics)) {
      console.error('Invalid metrics format:', rawData.metrics)
      return new Response(
        JSON.stringify({ error: 'Invalid metrics format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process the data and return refined results
    const refinedData = {
      deviceId: deviceId,
      timestamp: new Date().toISOString(),
      metrics: rawData.metrics,
      analysis: "Data processed successfully",
      severity: "info",
      confidence: 0.95,
      metadata: {
        ...rawData.metadata,
        deviceId: deviceId,
        processed_at: new Date().toISOString()
      }
    }

    console.log('Returning refined data:', refinedData)
    return new Response(
      JSON.stringify(refinedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing data:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})