import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SimulationParameters {
  temperature: { min: number; max: number; };
  pressure: { min: number; max: number; };
  vibration: { min: number; max: number; };
  production_rate: { min: number; max: number; };
}

function generateValue(min: number, max: number, isAnomaly: boolean): number {
  const normalValue = min + Math.random() * (max - min);
  if (!isAnomaly) return normalValue;
  
  // 20% chance of generating anomaly
  if (Math.random() < 0.2) {
    return Math.random() < 0.5 ? min - (Math.random() * 10) : max + (Math.random() * 10);
  }
  return normalValue;
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

    console.log('Fetching active simulations...');
    
    // Get active simulations
    const { data: simulations, error: simulationError } = await supabase
      .from('device_simulations')
      .select('*')
      .eq('is_running', true)
      .eq('simulation_type', 'industrial');

    if (simulationError) {
      console.error('Error fetching simulations:', simulationError);
      throw simulationError;
    }

    console.log('Found active simulations:', simulations?.length);

    for (const simulation of simulations || []) {
      const params = simulation.parameters as any;
      const isAnomaly = params.simulationType === 'anomaly';
      
      console.log(`Generating data for device ${simulation.device_id}, anomaly mode: ${isAnomaly}`);
      
      // Generate data for each parameter
      for (const [key, range] of Object.entries(params.parameters as SimulationParameters)) {
        const value = generateValue(range.min, range.max, isAnomaly);
        
        console.log(`Generated ${key} value: ${value}`);
        
        const { error: insertError } = await supabase
          .from('arduino_plc_data')
          .insert({
            device_id: simulation.device_id,
            data_type: key,
            value: value,
            metadata: {
              simulation: true,
              anomaly: isAnomaly
            }
          });

        if (insertError) {
          console.error(`Error inserting ${key} data:`, insertError);
          throw insertError;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in industrial simulator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})