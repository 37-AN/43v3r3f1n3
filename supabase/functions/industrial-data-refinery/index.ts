import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    if (!rawData?.deviceId || !rawData?.metrics || !Array.isArray(rawData.metrics)) {
      console.error('Invalid raw data structure:', rawData);
      return new Response(
        JSON.stringify({ error: 'Invalid or missing raw data structure' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const refinedMetrics = rawData.metrics.map(metric => ({
      metric_type: metric.metric_type || 'unknown',
      value: typeof metric.value === 'number' ? metric.value : 0,
      timestamp: metric.timestamp || rawData.timestamp || new Date().toISOString(),
      unit: metric.unit || 'unit',
      metadata: {
        quality_score: metric.metadata?.quality_score || 0.95,
        source: metric.metadata?.source || 'simulation_engine'
      }
    }));

    console.log('Processed metrics:', refinedMetrics);

    const response = {
      deviceId: rawData.deviceId,
      dataType: rawData.dataType || 'measurement',
      metrics: refinedMetrics,
      timestamp: rawData.timestamp || new Date().toISOString(),
      metadata: {
        ...rawData.metadata,
        processed_at: new Date().toISOString(),
        quality_score: 0.95,
        source: 'industrial_refinery'
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