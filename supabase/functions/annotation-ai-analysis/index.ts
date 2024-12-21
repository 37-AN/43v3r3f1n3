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
    const { rawData, dataType, deviceId } = await req.json();
    
    if (!rawData || !dataType || !deviceId) {
      throw new Error('Missing required parameters');
    }

    console.log('Processing annotation analysis for device:', deviceId);
    console.log('Data type:', dataType);
    console.log('Raw data:', rawData);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize Hugging Face inference
    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));

    // Prepare prompt for analysis
    const prompt = `Analyze this industrial data and provide annotation suggestions:
Data Type: ${dataType}
Device ID: ${deviceId}
Metrics: ${JSON.stringify(rawData.map((m: any) => ({
  type: m.metric_type,
  value: m.value,
  unit: m.unit
})), null, 2)}

Please provide analysis focusing on:
1. Data patterns and anomalies
2. Quality metrics
3. Suggested labels and categories
4. Potential issues or concerns
5. Confidence scores for suggestions

Format your response in a structured way.`;

    console.log('Sending request to Hugging Face model...');
    
    // Use model for text generation
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
    console.log('Received AI analysis:', analysis);

    // Create annotation batch
    const { data: batch, error: batchError } = await supabase
      .from('annotation_batches')
      .insert({
        name: `AI-Assisted Batch - Device ${deviceId}`,
        description: 'Automatically generated batch using AI model',
        data_type: dataType,
        status: 'pending'
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // Create annotation items
    const items = rawData.map((metric: any) => ({
      batch_id: batch.id,
      raw_data: metric,
      refined_data: {
        ai_suggestions: analysis,
        model: 'falcon-7b-instruct',
        confidence_score: 0.85,
        timestamp: new Date().toISOString()
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