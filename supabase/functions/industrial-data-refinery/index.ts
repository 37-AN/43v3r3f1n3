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

    // Validate required fields
    if (!rawData?.deviceId || typeof rawData.deviceId !== 'string') {
      console.error('Invalid or missing deviceId:', rawData);
      return new Response(
        JSON.stringify({ error: 'Invalid or missing deviceId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!Array.isArray(rawData.metrics)) {
      console.error('Invalid metrics format:', rawData.metrics);
      return new Response(
        JSON.stringify({ error: 'Invalid metrics format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const refinedMetrics = rawData.metrics.map(metric => ({
      metric_type: metric.metric_type || 'measurement',
      value: typeof metric.value === 'number' ? metric.value : 0,
      timestamp: metric.timestamp || new Date().toISOString(),
      unit: metric.unit || 'unit',
      metadata: {
        quality_score: 0.95,
        source: rawData.metadata?.source || 'industrial_refinery'
      }
    }));

    const response = {
      deviceId: rawData.deviceId,
      dataType: rawData.dataType || 'measurement',
      metrics: refinedMetrics,
      timestamp: new Date().toISOString(),
      metadata: {
        ...rawData.metadata,
        processed_at: new Date().toISOString(),
        quality_score: 0.95,
        source: 'industrial_refinery'
      }
    };

    console.log('Sending refined response:', response);
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