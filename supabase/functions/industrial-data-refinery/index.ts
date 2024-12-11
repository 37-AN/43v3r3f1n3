import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function validateRawData(rawData: any) {
  if (!rawData || typeof rawData !== 'object') {
    return { isValid: false, error: 'Raw data must be an object' };
  }

  const { deviceId, metrics, metadata } = rawData;

  // Validate deviceId (UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!deviceId || !uuidRegex.test(deviceId)) {
    return { isValid: false, error: 'Invalid deviceId format' };
  }

  // Validate metrics array
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return { isValid: false, error: 'Metrics must be a non-empty array' };
  }

  // Validate each metric
  for (const metric of metrics) {
    if (!metric.metric_type || typeof metric.value !== 'number') {
      return { isValid: false, error: 'Each metric must have a metric_type and numeric value' };
    }
  }

  return { isValid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData } = await req.json();
    console.log('Received raw data:', rawData);

    const validation = validateRawData(rawData);
    if (!validation.isValid) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { deviceId, metrics, metadata } = rawData;

    // Process the data and return refined results
    const refinedData = {
      deviceId,
      timestamp: new Date().toISOString(),
      metrics: metrics.map(metric => ({
        ...metric,
        metadata: {
          ...metric.metadata,
          device_id: deviceId,
          processed_at: new Date().toISOString()
        }
      })),
      analysis: "Data processed successfully",
      severity: "info",
      confidence: 0.95,
      metadata: {
        ...metadata,
        device_id: deviceId,
        processed_at: new Date().toISOString()
      }
    };

    console.log('Returning refined data:', refinedData);
    return new Response(
      JSON.stringify(refinedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing data:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})