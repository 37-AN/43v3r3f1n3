import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { features, deviceId, rawData } = await req.json();

    console.log('Analyzing data for device:', deviceId);
    console.log('Features:', features);
    console.log('Raw data:', rawData);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an industrial IoT analysis expert specialized in analyzing PLC and sensor data. Provide clear, concise insights about device performance, anomalies, and optimization opportunities.'
          },
          { 
            role: 'user', 
            content: `Analyze this industrial IoT data:
            Device ID: ${deviceId}
            Statistical Features:
            - Mean: ${features.mean}
            - Variance: ${features.variance}
            - Range: ${features.range}
            
            Raw Data: ${rawData}
            
            Provide a brief analysis focusing on:
            1. Performance patterns
            2. Anomalies
            3. Optimization recommendations`
          }
        ],
      }),
    });

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Determine severity based on content
    let severity = 'info';
    if (analysis.toLowerCase().includes('critical') || analysis.toLowerCase().includes('urgent')) {
      severity = 'critical';
    } else if (analysis.toLowerCase().includes('warning') || analysis.toLowerCase().includes('attention')) {
      severity = 'warning';
    }

    return new Response(
      JSON.stringify({ 
        analysis, 
        severity,
        confidence: 0.95
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze data' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});