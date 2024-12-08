import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LLM_STUDIO_URL = Deno.env.get('LLM_STUDIO_URL') || 'http://localhost:1234/v1';
const LLM_STUDIO_KEY = Deno.env.get('LLM_STUDIO_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { deviceId, data, timeRange } = await req.json()
    console.log('Analyzing data with LLM Studio for device:', deviceId)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Format data for LLM analysis
    const prompt = `Analyze this industrial IoT data and provide insights:
Device ID: ${deviceId}
Time Range: ${timeRange}
Data Points: ${JSON.stringify(data, null, 2)}

Provide insights about:
1. Performance patterns
2. Anomalies
3. Optimization recommendations
4. Predictive maintenance needs`;

    // Call LLM Studio API
    const llmResponse = await fetch(`${LLM_STUDIO_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_STUDIO_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are an industrial IoT analysis expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM Studio API error: ${llmResponse.statusText}`);
    }

    const llmData = await llmResponse.json();
    const analysis = llmData.choices[0].message.content;

    // Store the insight in the database
    const { error: insightError } = await supabase
      .from('ai_insights')
      .insert({
        device_id: deviceId,
        insight_type: 'llm_analysis',
        message: analysis,
        confidence: 0.85,
        severity: 'info',
        metadata: {
          model: 'llm_studio',
          analyzed_data_points: data.length,
          time_range: timeRange
        }
      });

    if (insightError) {
      console.error('Error storing insight:', insightError);
      throw insightError;
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in llm-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});