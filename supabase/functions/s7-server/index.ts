import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
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
    console.log('Received request to s7-server');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get request body
    const { operation, area, dbNumber, start, amount, wordLen, values } = await req.json() as S7Request

    // Validate request structure
    if (!operation || !area || typeof start !== 'number' || typeof amount !== 'number' || typeof wordLen !== 'number') {
      console.error('Invalid request structure:', { operation, area, start, amount, wordLen });
      return new Response(
        JSON.stringify({
          error: 'Invalid request structure',
          details: 'Required fields missing or invalid'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (operation === 'read') {
      // Simulate reading values
      const simulatedValues = Array(amount).fill(0).map(() => Math.floor(Math.random() * 65535))
      console.log('Generated simulated values:', simulatedValues);
      
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

      console.log('Successfully updated simulation state');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error(`Unsupported operation: ${operation}`)
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})