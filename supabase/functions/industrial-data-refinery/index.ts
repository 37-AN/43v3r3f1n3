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
    
    // Validate required fields
    if (!rawData || typeof rawData !== 'object') {
      console.error('Invalid raw data format - not an object')
      return new Response(
        JSON.stringify({ error: 'Invalid raw data format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { deviceId, metrics, metadata } = rawData
    
    // Validate deviceId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!deviceId || !uuidRegex.test(deviceId)) {
      console.error('Invalid deviceId:', deviceId)
      return new Response(
        JSON.stringify({ error: 'Invalid deviceId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate metrics array
    if (!Array.isArray(metrics) || metrics.length === 0) {
      console.error('Invalid metrics format:', metrics)
      return new Response(
        JSON.stringify({ error: 'Invalid metrics format or empty metrics array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process the data and return refined results
    const refinedData = {
      deviceId,
      timestamp: new Date().toISOString(),
      metrics: metrics.map(metric => ({
        ...metric,
        metadata: {
          ...metric.metadata,
          device_id: deviceId,
          processed_at: new Date().toISOString()
        }
      })),
      analysis: "Data processed successfully",
      severity: "info",
      confidence: 0.95,
      metadata: {
        ...metadata,
        device_id: deviceId,
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
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})