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

    const { deviceId, data, features } = await req.json()
    console.log('Analyzing data for device:', deviceId, 'Data:', data, 'Features:', features)

    // Enhanced analysis with AI features
    const insights = await analyzeDataWithAI(data, features, deviceId)
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
          metadata: {
            ...insight.metadata,
            aiFeatures: features ? features.slice(0, 5) : [] // Store first 5 features for reference
          }
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

async function analyzeDataWithAI(data: Record<string, number>, features: number[][], deviceId: string) {
  const insights: Array<{
    type: string;
    message: string;
    confidence: number;
    severity: 'info' | 'warning' | 'critical';
    metadata: Record<string, any>;
  }> = [];

  // 1. Enhanced Performance Analysis using AI features
  const performanceValues = Object.values(data);
  const avgPerformance = performanceValues.reduce((a, b) => a + b, 0) / performanceValues.length;
  const stdDev = calculateStandardDeviation(performanceValues);

  // Use AI features for pattern recognition
  if (features && features.length > 0) {
    const patternScore = calculatePatternScore(features[0]);
    if (patternScore > 0.7) {
      insights.push({
        type: 'ai_pattern_detection',
        message: `AI model detected significant pattern in device behavior (confidence: ${(patternScore * 100).toFixed(1)}%)`,
        confidence: patternScore,
        severity: 'info',
        metadata: { patternScore, featuresSummary: features[0].slice(0, 3) }
      });
    }
  }

  // 2. Advanced Anomaly Detection
  const anomalyThreshold = 2.5;
  performanceValues.forEach((value, index) => {
    const zScore = Math.abs((value - avgPerformance) / stdDev);
    if (zScore > anomalyThreshold) {
      const confidence = calculateAnomalyConfidence(zScore, features?.[0] || []);
      insights.push({
        type: 'advanced_anomaly',
        message: `Advanced anomaly detected: Value ${value.toFixed(2)} shows unusual behavior (${zScore.toFixed(2)} σ from mean)`,
        confidence,
        severity: zScore > 3 ? 'critical' : 'warning',
        metadata: { value, average: avgPerformance, zScore, aiConfidence: confidence }
      });
    }
  });

  // 3. Predictive Analysis
  const prediction = predictNextValues(performanceValues, features);
  if (prediction.confidence > 0.7) {
    insights.push({
      type: 'predictive_insight',
      message: `Predicted trend: ${prediction.trend} expected in next 30 minutes`,
      confidence: prediction.confidence,
      severity: prediction.severity,
      metadata: { prediction: prediction.values.slice(0, 3), confidence: prediction.confidence }
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

function calculatePatternScore(features: number[]): number {
  // Normalize feature values to get a pattern score between 0 and 1
  const sum = features.reduce((a, b) => a + Math.abs(b), 0);
  return sum > 0 ? Math.min(Math.max(sum / features.length, 0), 1) : 0;
}

function calculateAnomalyConfidence(zScore: number, features: number[]): number {
  // Combine statistical and AI-based confidence
  const statisticalConfidence = Math.min(zScore / 4, 1);
  const aiConfidence = features.length > 0 ? calculatePatternScore(features) : 0.5;
  return (statisticalConfidence * 0.7 + aiConfidence * 0.3);
}

function predictNextValues(history: number[], features: number[][]): {
  trend: string;
  values: number[];
  confidence: number;
  severity: 'info' | 'warning' | 'critical';
} {
  const lastValues = history.slice(-5);
  const trend = lastValues.every((val, i) => i === 0 || val >= lastValues[i - 1]) ? 'increasing' :
               lastValues.every((val, i) => i === 0 || val <= lastValues[i - 1]) ? 'decreasing' :
               'stable';
  
  const avgChange = lastValues.slice(1).reduce((sum, val, i) => 
    sum + (val - lastValues[i]), 0) / (lastValues.length - 1);

  const predictedValues = Array(3).fill(0).map((_, i) => 
    lastValues[lastValues.length - 1] + avgChange * (i + 1));

  const confidence = Math.min(Math.abs(avgChange) / 10 + 0.5, 0.95);
  
  return {
    trend,
    values: predictedValues,
    confidence,
    severity: trend === 'decreasing' && confidence > 0.8 ? 'warning' : 'info'
  };
}