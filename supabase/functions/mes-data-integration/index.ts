import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { data, error } = await req.json();
    
    if (!data) {
      console.error('No data provided');
      return new Response(
        JSON.stringify({ error: 'No data provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing MES data:', data);

    // Process the MES data
    const processedData = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: data
    };

    console.log('Successfully processed MES data:', processedData);

    return new Response(
      JSON.stringify(processedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error processing MES data:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to process MES data' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});