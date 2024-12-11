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

    // Enhanced deviceId validation
    if (!rawData?.deviceId || typeof rawData.deviceId !== 'string' || !rawData.deviceId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('Invalid deviceId format:', rawData?.deviceId);
      return new Response(
        JSON.stringify({ error: 'Invalid deviceId format. Must be a valid UUID.' }),
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

    // Process and refine the data
    const refinedData = {
      deviceId: rawData.deviceId,
      timestamp: new Date().toISOString(),
      metrics: rawData.metrics.map(metric => ({
        ...metric,
        quality_score: calculateQualityScore(metric),
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

function calculateQualityScore(metric: any): number {
  if (!metric || typeof metric.value !== 'number') {
    return 0;
  }
  
  const isInRange = metric.value >= 0 && metric.value < 10000;
  const hasValidTimestamp = Boolean(metric.timestamp);
  const hasMetadata = Boolean(metric.metadata);
  
  let score = 0.5; // Base score
  if (isInRange) score += 0.2;
  if (hasValidTimestamp) score += 0.15;
  if (hasMetadata) score += 0.15;
  
  return Math.min(1, score);
}