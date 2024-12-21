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
    const { deviceId, metrics, timeRange } = await req.json();
    console.log('Processing AI insights for device:', deviceId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch recent industrial data for context
    const { data: industrialData, error: dataError } = await supabase
      .from('refined_industrial_data')
      .select('*')
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (dataError) {
      throw new Error(`Error fetching industrial data: ${dataError.message}`);
    }

    const prompt = `Analyze this industrial IoT data and provide insights:
Device ID: ${deviceId}
Time Range: ${timeRange}
Current Metrics:
${Object.entries(metrics).map(([key, value]) => `${key}: ${value}`).join('\n')}

Recent Data Points:
${industrialData.map(d => `${d.data_type}: ${d.value} (Quality: ${d.quality_score})`).join('\n')}

Provide analysis focusing on:
1. Performance patterns and efficiency metrics
2. Anomaly detection and potential issues
3. Predictive maintenance recommendations
4. Resource optimization suggestions
5. Quality control insights`;

    console.log('Sending request to OpenAI...');
    
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an industrial AI expert specializing in manufacturing analytics and optimization.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      console.error('OpenAI API error:', await aiResponse.text());
      throw new Error('OpenAI API error');
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    // Store the AI-generated insight
    const { error: insertError } = await supabase
      .from('ai_insights')
      .insert({
        device_id: deviceId,
        insight_type: 'advanced_analysis',
        message: analysis,
        confidence: 0.95,
        severity: analysis.toLowerCase().includes('critical') ? 'critical' : 
                 analysis.toLowerCase().includes('warning') ? 'warning' : 'info',
        metadata: {
          analyzed_metrics: metrics,
          time_range: timeRange,
          model: 'gpt-3.5-turbo'
        }
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in industrial-ai-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});