import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IndustrialData {
  source: string;
  deviceId: string;
  timestamp: string;
  values: Record<string, number>;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing industrial data ingestion request');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const data: IndustrialData = await req.json()
    console.log('Received industrial data:', data);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.deviceId)) {
      console.error('Invalid UUID format:', data.deviceId);
      return new Response(
        JSON.stringify({ error: 'Invalid UUID format for deviceId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Store data in arduino_plc_data table
    const entries = Object.entries(data.values).map(([key, value]) => ({
      device_id: data.deviceId,
      data_type: key,
      value: value,
      timestamp: data.timestamp,
      metadata: {
        source: data.source,
        ...data.metadata
      }
    }));

    console.log('Storing industrial data entries:', entries);
    const { error } = await supabase
      .from('arduino_plc_data')
      .insert(entries);

    if (error) {
      console.error('Error storing industrial data:', error);
      throw error;
    }

    console.log('Successfully stored industrial data');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in industrial data ingestion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})