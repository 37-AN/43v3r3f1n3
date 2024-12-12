import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateFallbackInsight(metrics: Record<string, number>) {
  // Generate a basic insight based on metrics without using AI
  const efficiency = metrics.efficiency || 0;
  const stability = metrics.stability || 0;
  
  let severity: 'info' | 'warning' | 'critical' = 'info';
  let message = '';

  if (efficiency < 70 || stability < 70) {
    severity = 'critical';
    message = `Performance metrics are below threshold: Efficiency ${efficiency.toFixed(1)}%, Stability ${stability.toFixed(1)}%`;
  } else if (efficiency < 85 || stability < 85) {
    severity = 'warning';
    message = `Performance metrics need attention: Efficiency ${efficiency.toFixed(1)}%, Stability ${stability.toFixed(1)}%`;
  } else {
    message = `System operating normally: Efficiency ${efficiency.toFixed(1)}%, Stability ${stability.toFixed(1)}%`;
  }

  return {
    message,
    severity,
    confidence: 0.7
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { deviceId, metrics, timeRange } = await req.json();
    console.log('Processing AI insights for device:', deviceId);
    console.log('Metrics:', metrics);
    console.log('Time Range:', timeRange);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
      // Attempt to get AI-generated insight
      const prompt = `Analyze this industrial IoT data and provide insights:
Device ID: ${deviceId}
Time Range: ${timeRange}
Metrics:
${Object.entries(metrics).map(([key, value]) => `${key}: ${value}`).join('\n')}

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
          model: 'gpt-4o-mini',
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
        console.log('OpenAI API error, falling back to basic insight generation');
        throw new Error('OpenAI API error');
      }

      const aiData = await aiResponse.json();
      const analysis = aiData.choices[0].message.content;
      console.log('Generated AI analysis:', analysis);

      // Store the AI-generated insight
      await supabase
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
            model: 'gpt-4o-mini'
          }
        });

      return new Response(
        JSON.stringify({ success: true, analysis }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (aiError) {
      console.error('AI analysis failed, using fallback:', aiError);
      
      // Generate and store fallback insight
      const fallbackInsight = generateFallbackInsight(metrics);
      
      await supabase
        .from('ai_insights')
        .insert({
          device_id: deviceId,
          insight_type: 'basic_analysis',
          message: fallbackInsight.message,
          confidence: fallbackInsight.confidence,
          severity: fallbackInsight.severity,
          metadata: {
            analyzed_metrics: metrics,
            time_range: timeRange,
            fallback: true,
            error: aiError.message
          }
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          analysis: fallbackInsight.message,
          fallback: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in industrial-ai-insights function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});