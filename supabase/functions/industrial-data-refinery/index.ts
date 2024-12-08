import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

    // Validate required fields
    if (!rawData || !rawData.deviceId || !rawData.values || !Array.isArray(rawData.values)) {
      console.error('Invalid raw data structure:', rawData);
      throw new Error('Invalid or missing raw data structure');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process each metric
    const refinedMetrics = rawData.values.map(metric => {
      if (!metric.metric_type || typeof metric.value !== 'number') {
        console.error('Invalid metric:', metric);
        throw new Error('Invalid metric structure');
      }

      return {
        metric_type: metric.metric_type,
        value: metric.value,
        timestamp: metric.timestamp || rawData.timestamp,
        quality_score: 0.95
      };
    });

    console.log('Processed metrics:', refinedMetrics);

    // Return refined data
    const response = {
      deviceId: rawData.deviceId,
      dataType: rawData.dataType,
      metrics: refinedMetrics,
      quality_score: 0.95,
      timestamp: rawData.timestamp,
      metadata: {
        ...rawData.metadata,
        processed_at: new Date().toISOString()
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in data refinement:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});