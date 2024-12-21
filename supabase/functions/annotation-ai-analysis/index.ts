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
    const { rawData, dataType } = await req.json();
    console.log('Processing annotation analysis for data type:', dataType);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate AI analysis using OpenAI
    const prompt = `Analyze this industrial data and provide annotation suggestions:
Data Type: ${dataType}
Raw Data: ${JSON.stringify(rawData, null, 2)}

Provide analysis focusing on:
1. Data patterns and anomalies
2. Quality metrics
3. Suggested labels and categories
4. Potential issues or concerns
5. Confidence scores for suggestions`;

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
            content: 'You are an industrial data analysis expert specializing in data annotation and classification.'
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

    // Create a new annotation batch with AI suggestions
    const { data: batch, error: batchError } = await supabase
      .from('annotation_batches')
      .insert({
        name: `Auto-Generated Batch - ${new Date().toISOString()}`,
        description: 'AI-assisted annotation batch',
        data_type: dataType,
        status: 'pending'
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // Create annotation items with AI suggestions
    const items = Object.entries(rawData).map(([key, value]) => ({
      batch_id: batch.id,
      raw_data: { key, value },
      refined_data: {
        ai_suggestions: analysis,
        confidence_score: 0.85
      },
      status: 'pending'
    }));

    const { error: itemsError } = await supabase
      .from('annotation_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        batch_id: batch.id,
        analysis,
        items_count: items.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in annotation-ai-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});