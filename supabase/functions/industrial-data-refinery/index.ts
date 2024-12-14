import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { pipeline } from "https://esm.sh/@huggingface/transformers@2.12.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData } = await req.json();
    console.log('Received raw data for refinement:', rawData);

    if (!rawData || !rawData.deviceId || !rawData.metrics) {
      throw new Error('Invalid data format');
    }

    // Initialize AI pipeline for anomaly detection
    const classifier = await pipeline(
      "text-classification",
      "Xenova/industrial-anomaly-detection",
      { revision: "main" }
    );

    // Process each metric
    const refinedMetrics = await Promise.all(rawData.metrics.map(async (metric: any) => {
      try {
        // Convert metric to text format for classification
        const textData = `${metric.metric_type}: ${metric.value}`;
        const result = await classifier(textData);
        
        const anomalyScore = result[0].score;
        const isAnomaly = anomalyScore > 0.7;

        // Apply refinement based on anomaly detection
        let refinedValue = metric.value;
        if (isAnomaly) {
          // Use moving average for anomalous values
          refinedValue = calculateMovingAverage(rawData.metrics, metric);
        }

        return {
          ...metric,
          metadata: {
            ...metric.metadata,
            refined: true,
            anomaly_score: anomalyScore,
            is_anomaly: isAnomaly,
            original_value: metric.value,
            refinement_timestamp: new Date().toISOString()
          },
          value: refinedValue
        };
      } catch (error) {
        console.error('Error processing metric:', error);
        return metric;
      }
    }));

    const refinedData = {
      deviceId: rawData.deviceId,
      metrics: refinedMetrics,
      analysis: generateAnalysis(refinedMetrics),
      severity: determineSeverity(refinedMetrics),
      confidence: calculateConfidence(refinedMetrics),
      metadata: {
        ...rawData.metadata,
        processed_at: new Date().toISOString(),
        source: 'industrial_data_refinery'
      }
    };

    console.log('Refined data:', refinedData);

    // Store refined data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: insertError } = await supabase
      .from('refined_industrial_data')
      .insert(refinedMetrics.map(metric => ({
        device_id: rawData.deviceId,
        data_type: metric.metric_type,
        value: metric.value,
        quality_score: 1 - (metric.metadata.anomaly_score || 0),
        metadata: metric.metadata
      })));

    if (insertError) {
      console.error('Error storing refined data:', insertError);
      throw insertError;
    }

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

// Helper functions
function calculateMovingAverage(metrics: any[], currentMetric: any, windowSize = 5) {
  const sameTypeMetrics = metrics.filter(m => m.metric_type === currentMetric.metric_type);
  const index = sameTypeMetrics.indexOf(currentMetric);
  const start = Math.max(0, index - windowSize);
  const end = Math.min(sameTypeMetrics.length, index + windowSize + 1);
  const window = sameTypeMetrics.slice(start, end);
  
  return window.reduce((sum, m) => sum + m.value, 0) / window.length;
}

function generateAnalysis(metrics: any[]) {
  const anomalies = metrics.filter(m => m.metadata.is_anomaly);
  if (anomalies.length === 0) return 'All metrics within normal parameters';
  
  return `Detected ${anomalies.length} anomalies. Affected metrics: ${
    anomalies.map(a => a.metric_type).join(', ')
  }`;
}

function determineSeverity(metrics: any[]) {
  const anomalyCount = metrics.filter(m => m.metadata.is_anomaly).length;
  const anomalyRatio = anomalyCount / metrics.length;
  
  if (anomalyRatio > 0.5) return 'critical';
  if (anomalyRatio > 0.2) return 'warning';
  return 'info';
}

function calculateConfidence(metrics: any[]) {
  const avgQualityScore = metrics.reduce(
    (sum, m) => sum + (1 - (m.metadata.anomaly_score || 0)), 
    0
  ) / metrics.length;
  
  return Number(avgQualityScore.toFixed(2));
}