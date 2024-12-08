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
    console.log('Received raw data for refinement:', rawData);

    // Validate input data
    if (!rawData || !rawData.deviceId || !rawData.values || !Array.isArray(rawData.values)) {
      console.error('Invalid or missing raw data structure:', rawData);
      throw new Error('Invalid or missing raw data structure');
    }

    // Initialize quality metrics
    let qualityScore = 1.0;
    const anomalyThreshold = 2.5;
    
    // Basic statistical analysis
    const values = rawData.values.filter(value => typeof value === 'number' && !isNaN(value));

    if (values.length === 0) {
      throw new Error('No valid numerical values found in raw data');
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    );

    // Detect and handle anomalies
    const cleanedValues = values.map(value => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > anomalyThreshold) {
        qualityScore *= 0.9;
        return mean;
      }
      return value;
    });

    // Process and refine the data
    const refinedData = {
      deviceId: rawData.deviceId,
      dataType: rawData.dataType || 'measurement',
      value: cleanedValues[0],
      qualityScore,
      metadata: {
        mean,
        stdDev,
        timestamp: rawData.timestamp || new Date().toISOString(),
        originalValue: values[0],
        anomaliesDetected: values.length - cleanedValues.length,
        owner_id: rawData.metadata?.owner_id
      }
    };

    console.log('Refined data:', refinedData);

    return new Response(
      JSON.stringify(refinedData),
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