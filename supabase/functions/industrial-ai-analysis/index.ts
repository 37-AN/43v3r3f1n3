import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { deviceId, timeRange, metrics } = await req.json();
    console.log('Processing AI analysis for device:', deviceId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch historical data for context
    const { data: historicalData, error: historyError } = await supabase
      .from('refined_industrial_data')
      .select('*')
      .eq('device_id', deviceId)
      .gte('timestamp', timeRange.start)
      .lte('timestamp', timeRange.end);

    if (historyError) {
      throw new Error(`Error fetching historical data: ${historyError.message}`);
    }

    // Generate AI analysis using OpenAI
    const prompt = `Analyze this industrial IoT data and provide insights:
Device ID: ${deviceId}
Time Range: ${timeRange.start} to ${timeRange.end}
Current Metrics: ${JSON.stringify(metrics, null, 2)}
Historical Data Points: ${historicalData.length}

Provide analysis focusing on:
1. Performance patterns and efficiency metrics
2. Anomaly detection and potential issues
3. Predictive maintenance recommendations
4. Resource optimization suggestions`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an industrial AI expert specializing in manufacturing analytics and optimization.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    // Store the insight
    const { error: insertError } = await supabase
      .from('ai_insights')
      .insert({
        device_id: deviceId,
        insight_type: 'comprehensive_analysis',
        message: analysis,
        confidence: 0.95,
        severity: analysis.toLowerCase().includes('critical') ? 'critical' : 
                 analysis.toLowerCase().includes('warning') ? 'warning' : 'info',
        metadata: {
          analyzed_metrics: metrics,
          time_range: timeRange,
          data_points: historicalData.length
        }
      });

    if (insertError) {
      throw new Error(`Error storing insight: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in industrial-ai-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});