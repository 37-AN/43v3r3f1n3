import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface S7Request {
  operation: 'read' | 'write';
  area: 'DB' | 'M' | 'I' | 'Q';
  dbNumber?: number;
  start: number;
  amount: number;
  wordLen: number;
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
    const { operation, area, dbNumber, start, amount, wordLen, values } = await req.json() as S7Request

    // Simulate S7 communication (replace with actual S7 implementation)
    console.log(`S7 ${operation} request:`, { area, dbNumber, start, amount, wordLen, values })

    if (operation === 'read') {
      // Simulate reading values
      const simulatedValues = Array(amount).fill(0).map(() => Math.floor(Math.random() * 65535))
      
      return new Response(
        JSON.stringify({ values: simulatedValues }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (operation === 'write') {
      if (!values) {
        throw new Error('Values are required for write operation')
      }

      // Update the simulation state in the database
      const { error } = await supabase
        .from('device_simulations')
        .update({
          parameters: {
            s7: { area, dbNumber, start, values }
          }
        })
        .eq('is_running', true)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error(`Unsupported operation: ${operation}`)
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