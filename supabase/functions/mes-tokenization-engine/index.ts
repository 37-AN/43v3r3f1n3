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
    const { refinedData } = await req.json();
    console.log('Received refined data for MES processing:', refinedData);

    // Validate input data
    if (!refinedData || !refinedData.deviceId || refinedData.values === undefined) {
      console.error('Invalid or missing refined data:', refinedData);
      throw new Error('Invalid or missing refined data');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process each value from the refined data
    const mesMetrics = refinedData.values.map((value: number, index: number) => ({
      device_id: refinedData.deviceId,
      metric_type: refinedData.metadata?.metrics?.[index] || 'unknown',
      value: value,
      unit: refinedData.metadata?.unit || 'unit',
      timestamp: refinedData.timestamp || new Date().toISOString(),
      metadata: {
        quality_score: refinedData.quality_score || 1.0,
        source: refinedData.metadata?.source || 'simulation',
        category: refinedData.metadata?.category || 'default'
      }
    }));

    console.log('Storing MES metrics:', mesMetrics);

    // Store MES metrics in batches
    for (const metric of mesMetrics) {
      const { error: metricsError } = await supabaseClient
        .from('mes_metrics')
        .insert(metric);

      if (metricsError) {
        console.error('Error storing MES metric:', metricsError);
        throw metricsError;
      }
    }

    console.log('Successfully stored MES metrics');

    // Create tokenization records for high-quality metrics
    const tokenizationPromises = mesMetrics
      .filter(metric => (metric.metadata.quality_score || 0) >= 0.8)
      .map(metric => {
        const tokenData = {
          asset_type: 'industrial_data',
          name: `${metric.metric_type}_${metric.timestamp}`,
          description: `Tokenized industrial data for ${metric.metric_type}`,
          token_symbol: 'IND',
          total_supply: 1000000,
          price_per_token: 0.001,
          owner_id: refinedData.metadata?.owner_id,
          metadata: {
            source_metric: metric,
            timestamp: metric.timestamp,
            quality_score: metric.metadata.quality_score
          }
        };

        return supabaseClient
          .from('tokenized_assets')
          .insert(tokenData);
      });

    await Promise.all(tokenizationPromises);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Data processed and tokenized successfully',
        processedMetrics: mesMetrics.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in MES tokenization engine:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});