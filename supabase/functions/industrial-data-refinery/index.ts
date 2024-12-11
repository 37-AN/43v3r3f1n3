import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData } = await req.json();
    console.log('Received raw data:', rawData);

    // Validate deviceId
    if (!rawData?.deviceId || typeof rawData.deviceId !== 'string') {
      console.error('Invalid or missing deviceId:', rawData?.deviceId);
      return new Response(
        JSON.stringify({ error: 'Invalid or missing deviceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate metrics array
    if (!Array.isArray(rawData.metrics) || rawData.metrics.length === 0) {
      console.error('Invalid metrics format:', rawData.metrics);
      return new Response(
        JSON.stringify({ error: 'Metrics must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each metric
    for (const metric of rawData.metrics) {
      if (!metric.metric_type || typeof metric.value !== 'number') {
        console.error('Invalid metric format:', metric);
        return new Response(
          JSON.stringify({ error: 'Invalid metric format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process and store refined data
    const refinedData = {
      deviceId: rawData.deviceId,
      timestamp: new Date().toISOString(),
      metrics: rawData.metrics.map(metric => ({
        ...metric,
        quality_score: 0.95,
        metadata: {
          ...metric.metadata,
          refined: true,
          source: rawData.metadata?.source || 'industrial_data_refinery'
        }
      }))
    };

    console.log('Processed refined data:', refinedData);

    return new Response(
      JSON.stringify(refinedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in industrial data refinery:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});