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

    // Enhanced analysis with multiple insight types
    const insights = await analyzeData(data, deviceId)
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

async function analyzeData(data: Record<string, number>, deviceId: string) {
  const insights: Array<{
    type: string;
    message: string;
    confidence: number;
    severity: 'info' | 'warning' | 'critical';
    metadata: Record<string, any>;
  }> = [];

  // 1. Performance Analysis
  const performanceValues = Object.values(data);
  const avgPerformance = performanceValues.reduce((a, b) => a + b, 0) / performanceValues.length;
  const stdDev = calculateStandardDeviation(performanceValues);

  // Performance trend analysis
  if (avgPerformance < 50) {
    insights.push({
      type: 'performance_alert',
      message: `Low average performance detected: ${avgPerformance.toFixed(2)}%. Consider maintenance check.`,
      confidence: 0.85,
      severity: 'warning',
      metadata: { avgPerformance, threshold: 50 }
    });
  }

  // 2. Anomaly Detection (using Z-score)
  const zScoreThreshold = 2;
  performanceValues.forEach((value, index) => {
    const zScore = Math.abs((value - avgPerformance) / stdDev);
    if (zScore > zScoreThreshold) {
      insights.push({
        type: 'anomaly_detection',
        message: `Anomaly detected: Value ${value.toFixed(2)} deviates significantly (${zScore.toFixed(2)} standard deviations) from average`,
        confidence: Math.min(0.95, 0.7 + (zScore - zScoreThreshold) * 0.1),
        severity: zScore > 3 ? 'critical' : 'warning',
        metadata: { value, average: avgPerformance, zScore, threshold: zScoreThreshold }
      });
    }
  });

  // 3. Trend Analysis
  const trendWindow = Math.min(10, performanceValues.length);
  const recentValues = performanceValues.slice(-trendWindow);
  const trendSlope = calculateTrendSlope(recentValues);

  if (Math.abs(trendSlope) > 0.1) {
    insights.push({
      type: 'trend_analysis',
      message: `${trendSlope > 0 ? 'Upward' : 'Downward'} trend detected: Performance is ${trendSlope > 0 ? 'improving' : 'declining'} at ${Math.abs(trendSlope * 100).toFixed(1)}% per interval`,
      confidence: 0.8,
      severity: trendSlope < -0.2 ? 'warning' : 'info',
      metadata: { trendSlope, windowSize: trendWindow }
    });
  }

  // 4. Pattern Recognition
  const patterns = detectPatterns(performanceValues);
  if (patterns.length > 0) {
    insights.push({
      type: 'pattern_recognition',
      message: `Detected ${patterns.join(', ')} in performance data`,
      confidence: 0.75,
      severity: 'info',
      metadata: { patterns }
    });
  }

  return insights;
}

function calculateStandardDeviation(values: number[]): number {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

function calculateTrendSlope(values: number[]): number {
  if (values.length < 2) return 0;
  
  const xMean = (values.length - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / values.length;
  
  let numerator = 0;
  let denominator = 0;
  
  values.forEach((y, x) => {
    numerator += (x - xMean) * (y - yMean);
    denominator += Math.pow(x - xMean, 2);
  });
  
  return denominator ? numerator / denominator : 0;
}

function detectPatterns(values: number[]): string[] {
  const patterns: string[] = [];
  
  // Detect oscillation
  let oscillations = 0;
  let increasing = true;
  for (let i = 1; i < values.length; i++) {
    if (increasing && values[i] < values[i-1]) {
      oscillations++;
      increasing = false;
    } else if (!increasing && values[i] > values[i-1]) {
      oscillations++;
      increasing = true;
    }
  }
  if (oscillations > values.length / 3) {
    patterns.push('oscillating behavior');
  }

  // Detect plateaus
  let plateauCount = 0;
  let plateauLength = 1;
  for (let i = 1; i < values.length; i++) {
    if (Math.abs(values[i] - values[i-1]) < 0.1) {
      plateauLength++;
    } else {
      if (plateauLength > 3) plateauCount++;
      plateauLength = 1;
    }
  }
  if (plateauCount > 0) {
    patterns.push('stable periods');
  }

  return patterns;
}