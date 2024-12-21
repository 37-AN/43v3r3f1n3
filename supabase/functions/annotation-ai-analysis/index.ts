import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

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

    // Initialize Hugging Face inference
    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));

    // Prepare prompt for Falcon model
    const prompt = `Analyze this industrial data and provide annotation suggestions:
Data Type: ${dataType}
Raw Data: ${JSON.stringify(rawData, null, 2)}

Please provide analysis focusing on:
1. Data patterns and anomalies
2. Quality metrics
3. Suggested labels and categories
4. Potential issues or concerns
5. Confidence scores for suggestions

Format your response in a structured way.`;

    console.log('Sending request to Hugging Face Falcon model...');
    
    // Use Falcon model for text generation
    const result = await hf.textGeneration({
      model: 'tiiuae/falcon-7b-instruct',
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false,
      },
    });

    const analysis = result.generated_text;
    console.log('Received Falcon analysis:', analysis);

    // Create a new annotation batch with AI suggestions
    const { data: batch, error: batchError } = await supabase
      .from('annotation_batches')
      .insert({
        name: `AI-Assisted Batch (Falcon) - ${new Date().toISOString()}`,
        description: 'Automatically generated batch using Falcon AI model',
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
        model: 'falcon-7b-instruct',
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