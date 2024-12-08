import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { deviceId, data } = await req.json()
    console.log('Analyzing data for device:', deviceId, 'Data:', data)

    // Analyze the data using patterns and thresholds
    const insights = analyzeData(data)
    console.log('Generated insights:', insights)

    // Store insights in the database
    for (const insight of insights) {
      const { error } = await supabase
        .from('ai_insights')
        .insert({
          device_id: deviceId,
          insight_type: insight.type,
          message: insight.message,
          confidence: insight.confidence,
          severity: insight.severity,
          metadata: insight.metadata
        })

      if (error) {
        console.error('Error storing insight:', error)
        throw error
      }
    }

    return new Response(
      JSON.stringify({ success: true, insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyze-plc-data function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function analyzeData(data: Record<string, number>) {
  const insights: Array<{
    type: string;
    message: string;
    confidence: number;
    severity: 'info' | 'warning' | 'critical';
    metadata: Record<string, any>;
  }> = [];

  // Analyze performance metrics
  const performanceValues = Object.values(data);
  const avgPerformance = performanceValues.reduce((a, b) => a + b, 0) / performanceValues.length;

  if (avgPerformance < 50) {
    insights.push({
      type: 'performance_alert',
      message: `Low average performance detected: ${avgPerformance.toFixed(2)}%`,
      confidence: 0.85,
      severity: 'warning',
      metadata: { avgPerformance }
    });
  }

  // Detect anomalies using standard deviation
  const stdDev = calculateStandardDeviation(performanceValues);
  const threshold = 2; // Number of standard deviations for anomaly detection

  performanceValues.forEach((value, index) => {
    if (Math.abs(value - avgPerformance) > threshold * stdDev) {
      insights.push({
        type: 'anomaly_detection',
        message: `Anomaly detected: Value ${value.toFixed(2)} deviates significantly from average`,
        confidence: 0.9,
        severity: 'critical',
        metadata: { value, average: avgPerformance, standardDeviation: stdDev }
      });
    }
  });

  return insights;
}

function calculateStandardDeviation(values: number[]): number {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}