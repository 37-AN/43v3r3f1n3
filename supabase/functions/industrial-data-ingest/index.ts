import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IndustrialData {
  source: string
  deviceId: string
  timestamp: string
  values: Record<string, number>
  metadata: {
    unit: string
    batch: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const data: IndustrialData = await req.json()
    console.log('Received industrial data:', data)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(data.deviceId)) {
      console.error('Invalid UUID format:', data.deviceId)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid UUID format for deviceId',
          details: `Received deviceId: ${data.deviceId}`
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Store data in arduino_plc_data table
    const entries = Object.entries(data.values).map(([key, value]) => ({
      device_id: data.deviceId,
      data_type: key,
      value: value,
      metadata: {
        source: data.source,
        unit: data.metadata.unit,
        batch: data.metadata.batch
      }
    }))

    console.log('Preparing to insert entries:', entries)

    const { error } = await supabaseClient
      .from('arduino_plc_data')
      .insert(entries)

    if (error) {
      console.error('Error inserting data:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to insert data',
          details: error.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Data ingested successfully' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ 
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