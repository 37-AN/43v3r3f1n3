import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Parse request body
    const { startDate, endDate } = await req.json()

    // Set default date range if not provided
    const queryStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const queryEndDate = endDate ? new Date(endDate) : new Date()

    console.log('Querying with date range:', {
      start: queryStartDate.toISOString(),
      end: queryEndDate.toISOString()
    })

    // Fetch PLC data
    const { data: plcData, error: plcError } = await supabase
      .from('arduino_plc_data')
      .select('*, plc_devices(name)')
      .gte('timestamp', queryStartDate.toISOString())
      .lte('timestamp', queryEndDate.toISOString())

    if (plcError) {
      throw plcError
    }

    return new Response(
      JSON.stringify({ data: plcData }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})