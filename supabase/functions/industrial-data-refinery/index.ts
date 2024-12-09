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

    // Process metrics with validation
    const refinedMetrics = rawData.metrics.map(metric => {
      if (!metric.metric_type) {
        console.warn('Missing metric_type, using default');
        metric.metric_type = 'unknown';
      }

      return {
        metric_type: metric.metric_type,
        value: typeof metric.value === 'number' ? metric.value : 0,
        timestamp: metric.timestamp || rawData.timestamp || new Date().toISOString(),
        quality_score: metric.metadata?.quality_score || 0.95,
        unit: metric.unit || 'unit'
      };
    });

    console.log('Processed metrics:', refinedMetrics);

    // Return refined data with complete structure
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