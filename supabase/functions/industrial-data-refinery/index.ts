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
    console.log('Received raw data for refinement:', rawData);

    // Initialize quality metrics
    let qualityScore = 1.0;
    const anomalyThreshold = 2.5;
    
    // Basic statistical analysis
    const values = Object.values(rawData).filter(v => typeof v === 'number');
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    );

    // Detect and handle anomalies
    const cleanedValues = values.map(value => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > anomalyThreshold) {
        qualityScore *= 0.9;
        return mean; // Replace anomaly with mean
      }
      return value;
    });

    // Process and refine the data
    const refinedData = {
      deviceId: rawData.deviceId || rawData.device_id,
      dataType: rawData.dataType || rawData.type || 'measurement',
      value: cleanedValues[0], // Use first cleaned value
      qualityScore,
      metadata: {
        mean,
        stdDev,
        timestamp: new Date().toISOString(),
        originalValue: values[0],
        anomaliesDetected: values.length - cleanedValues.length
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