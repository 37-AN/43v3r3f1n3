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
    const { rawData } = await req.json();
    console.log('Received raw data:', rawData);

    if (!rawData || !rawData.deviceId) {
      throw new Error('Missing deviceId in request');
    }

    if (!isValidUUID(rawData.deviceId)) {
      throw new Error('Invalid deviceId format. Must be a valid UUID.');
    }

    if (!Array.isArray(rawData.metrics) || rawData.metrics.length === 0) {
      throw new Error('Invalid or empty metrics array');
    }

    // Process the metrics
    const refinedData = {
      deviceId: rawData.deviceId,
      timestamp: new Date().toISOString(),
      metrics: rawData.metrics.map((metric: any) => ({
        ...metric,
        quality_score: calculateQualityScore(metric),
        refined_value: normalizeValue(metric.value),
      })),
      analysis: generateAnalysis(rawData.metrics),
      severity: determineSeverity(rawData.metrics),
      confidence: 0.95
    };

    console.log('Processed refined data:', refinedData);

    return new Response(
      JSON.stringify(refinedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
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
  
  let score = 0.5;
  if (isInRange) score += 0.2;
  if (hasValidTimestamp) score += 0.15;
  if (hasMetadata) score += 0.15;
  
  return Math.min(score, 1);
}

function normalizeValue(value: number): number {
  if (typeof value !== 'number') return 0;
  return Math.max(0, Math.min(value, 10000));
}

function generateAnalysis(metrics: any[]): string {
  const avgValue = metrics.reduce((sum, m) => sum + (m.value || 0), 0) / metrics.length;
  if (avgValue > 8000) return "Critical: Values exceeding normal range";
  if (avgValue > 6000) return "Warning: Values approaching upper limit";
  if (avgValue < 1000) return "Warning: Values below expected range";
  return "Normal: Values within expected range";
}

function determineSeverity(metrics: any[]): string {
  const avgValue = metrics.reduce((sum, m) => sum + (m.value || 0), 0) / metrics.length;
  if (avgValue > 8000) return "critical";
  if (avgValue > 6000) return "warning";
  return "info";
}