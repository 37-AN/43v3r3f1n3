import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { refinedData } = await req.json();
    console.log('Received refined data:', refinedData);

    if (!refinedData || !refinedData.deviceId) {
      throw new Error('Missing deviceId in request');
    }

    if (!isValidUUID(refinedData.deviceId)) {
      throw new Error('Invalid deviceId format. Must be a valid UUID.');
    }

    // Process metrics into MES format
    const mesMetrics = refinedData.metrics.map((metric: any) => ({
      device_id: refinedData.deviceId,
      metric_type: metric.metric_type || 'unknown',
      value: metric.refined_value || metric.value,
      unit: metric.unit || 'unit',
      timestamp: new Date().toISOString(),
      metadata: {
        quality_score: metric.quality_score || 0.8,
        source: 'mes_tokenization_engine',
        original_value: metric.value,
      }
    }));

    console.log('Processed MES metrics:', mesMetrics);

    return new Response(
      JSON.stringify({
        success: true,
        mesMetrics,
        tokenizationStatus: 'processed',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in MES tokenization:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});