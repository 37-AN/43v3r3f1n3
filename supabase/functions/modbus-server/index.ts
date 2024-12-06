import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ModbusRequest {
  functionCode: number;
  address: number;
  quantity?: number;
  values?: number[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get request body
    const { functionCode, address, quantity, values } = await req.json() as ModbusRequest

    // Handle different Modbus function codes
    switch (functionCode) {
      case 1: // Read Coils
      case 2: // Read Discrete Inputs
        console.log(`Reading ${quantity} coils/discrete inputs from address ${address}`)
        return new Response(
          JSON.stringify({
            values: Array(quantity).fill(0).map(() => Math.random() > 0.5 ? 1 : 0)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 3: // Read Holding Registers
      case 4: // Read Input Registers
        console.log(`Reading ${quantity} holding/input registers from address ${address}`)
        return new Response(
          JSON.stringify({
            values: Array(quantity).fill(0).map(() => Math.floor(Math.random() * 65535))
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 5: // Write Single Coil
      case 6: // Write Single Register
        console.log(`Writing value to address ${address}`)
        // Update the simulation state in the database
        const { error } = await supabase
          .from('device_simulations')
          .update({
            parameters: {
              registers: [{ address, value: values?.[0] ?? 0 }]
            }
          })
          .eq('is_running', true)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error(`Unsupported function code: ${functionCode}`)
    }
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})