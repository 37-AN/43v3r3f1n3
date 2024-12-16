import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Received MES data integration request');
    const { data } = await req.json();
    
    if (!data) {
      console.error('No data provided');
      return new Response(
        JSON.stringify({ error: 'No data provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing MES data:', data);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process and store MES metrics
    const { error: metricsError } = await supabaseClient
      .from('mes_metrics')
      .insert({
        device_id: data.deviceId,
        metric_type: data.metricType,
        value: data.value,
        unit: data.unit,
        metadata: {
          quality_score: data.qualityScore || 0.95,
          source: 'mes_integration',
          category: data.category || 'default'
        }
      });

    if (metricsError) {
      console.error('Error storing MES metrics:', metricsError);
      throw metricsError;
    }

    // Process and store refined MES data
    const { error: refinedError } = await supabaseClient
      .from('refined_mes_data')
      .insert({
        device_id: data.deviceId,
        data_type: data.metricType,
        value: data.value,
        quality_score: data.qualityScore || 0.95,
        process_parameters: data.processParameters || {},
        batch_id: data.batchId,
        production_line: data.productionLine,
        metadata: {
          source: 'mes_integration',
          refined: true
        }
      });

    if (refinedError) {
      console.error('Error storing refined MES data:', refinedError);
      throw refinedError;
    }

    console.log('Successfully processed and stored MES data');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data processed successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error processing MES data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process MES data',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});