import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const data = await req.json()
    console.log('Received industrial data:', data)

    // Validate required fields
    if (!data.deviceId || !data.source || !data.values) {
      console.error('Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Store data points in arduino_plc_data table
    const entries = Object.entries(data.values).map(([key, value]) => ({
      device_id: data.deviceId,
      data_type: key,
      value: value,
      metadata: {
        source: data.source,
        unit: data.metadata?.unit,
        batch: data.metadata?.batch
      }
    }))

    console.log('Preparing to insert entries:', entries)

    const { error: insertError } = await supabaseAdmin
      .from('arduino_plc_data')
      .insert(entries)

    if (insertError) {
      console.error('Error inserting data:', insertError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to insert data',
          details: insertError.message
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