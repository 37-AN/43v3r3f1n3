import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ArduinoPLCData {
  device_id: string;
  data_type: string;
  value: number;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Received Arduino PLC data request')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get request body
    const data = await req.json() as ArduinoPLCData

    console.log('Processing Arduino PLC data:', data)

    // Validate required fields
    if (!data.device_id || !data.data_type || data.value === undefined) {
      throw new Error('Missing required fields: device_id, data_type, or value')
    }

    // Insert data into the arduino_plc_data table
    const { error } = await supabase
      .from('arduino_plc_data')
      .insert({
        device_id: data.device_id,
        data_type: data.data_type,
        value: data.value,
        metadata: data.metadata || {}
      })

    if (error) {
      console.error('Error inserting data:', error)
      throw error
    }

    console.log('Successfully stored Arduino PLC data')

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error processing Arduino PLC data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})