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
    if (!Array.isArray(rawData.metrics) || rawData.metrics.length === 0) {
      console.error('Invalid or empty metrics array:', rawData.metrics)
      return new Response(
        JSON.stringify({ error: 'Invalid metrics format or empty metrics array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate each metric
    for (const metric of rawData.metrics) {
      if (!metric.value || typeof metric.value !== 'number') {
        console.error('Invalid metric value:', metric)
        return new Response(
          JSON.stringify({ error: 'Invalid metric value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Process the data and return refined results
    const refinedData = {
      deviceId,
      timestamp: new Date().toISOString(),
      metrics: rawData.metrics,
      analysis: "Data processed successfully",
      severity: "info",
      confidence: 0.95,
      metadata: {
        ...rawData.metadata,
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