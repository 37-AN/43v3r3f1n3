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
    console.log('Raw data sample:', rawData.slice(0, 3));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize Hugging Face inference with API token
    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));

    // Prepare data for analysis
    const dataPoints = Array.isArray(rawData) ? rawData : [rawData];
    const formattedData = dataPoints.map(point => {
      return `Value: ${point.value}, Type: ${point.metric_type}, Timestamp: ${point.timestamp}`;
    }).join('\n');

    // Create analysis prompt
    const prompt = `Analyze this industrial data and provide detailed annotation suggestions:
Data Type: ${dataType}
Device ID: ${deviceId}
Data Points:
${formattedData}

Please analyze for:
1. Data patterns and anomalies
2. Quality metrics
3. Suggested labels and categories
4. Potential issues or concerns
5. Confidence scores for suggestions

Format your response in a structured way.`;

    console.log('Sending request to Hugging Face model...');
    
    // Use Falcon model for analysis
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
        description: 'Automatically generated batch using Falcon-7B model',
        data_type: dataType,
        status: 'pending',
        total_items: dataPoints.length,
        model_config: {
          model: 'falcon-7b-instruct',
          temperature: 0.7,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (batchError) {
      console.error('Error creating batch:', batchError);
      throw batchError;
    }

    // Create annotation items
    const items = dataPoints.map(point => ({
      batch_id: batch.id,
      raw_data: point,
      ai_suggestions: {
        analysis: analysis,
        confidence_score: 0.85,
        model: 'falcon-7b-instruct',
        timestamp: new Date().toISOString()
      },
      status: 'pending',
      confidence_score: 0.85
    }));

    const { error: itemsError } = await supabase
      .from('annotation_items')
      .insert(items);

    if (itemsError) {
      console.error('Error creating items:', itemsError);
      throw itemsError;
    }

    // Update batch with initial stats
    const { error: updateError } = await supabase
      .from('annotation_batches')
      .update({ 
        total_items: items.length,
        completed_items: 0
      })
      .eq('id', batch.id);

    if (updateError) {
      console.error('Error updating batch stats:', updateError);
      throw updateError;
    }

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