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
    console.log('Received data in MES engine:', refinedData);

    // Validate required fields
    if (!refinedData || typeof refinedData !== 'object') {
      console.error('Invalid refined data structure:', refinedData);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid refined data structure' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!refinedData.deviceId || !refinedData.metrics || !Array.isArray(refinedData.metrics)) {
      console.error('Missing required fields in refined data:', refinedData);
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields in refined data' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process each metric
    const mesMetricsPromises = refinedData.metrics.map(metric => {
      if (!metric.metric_type || typeof metric.value !== 'number') {
        console.warn('Skipping invalid metric:', metric);
        return Promise.resolve();
      }

      const metricData = {
        device_id: refinedData.deviceId,
        metric_type: metric.metric_type,
        value: metric.value,
        unit: metric.unit || 'unit',
        timestamp: metric.timestamp || refinedData.timestamp || new Date().toISOString(),
        metadata: {
          quality_score: metric.metadata?.quality_score || 0.95,
          source: refinedData.metadata?.source || 'mes_engine',
          source_device_id: refinedData.deviceId,
          category: metric.category || 'measurement'
        }
      };

      console.log('Storing MES metric:', metricData);
      return supabaseClient.from('mes_metrics').insert(metricData);
    });

    await Promise.all(mesMetricsPromises.filter(p => p !== undefined));
    console.log('Successfully stored MES metrics');

    // Create or update tokenized asset
    const assetData = {
      asset_type: 'industrial_metric',
      name: `Device ${refinedData.deviceId} Metrics`,
      token_symbol: 'MES',
      total_supply: 1000000,
      price_per_token: 0.001,
      owner_id: refinedData.metadata?.owner_id,
      metadata: {
        source_device_id: refinedData.deviceId,
        last_update: new Date().toISOString(),
        quality_score: refinedData.metadata?.quality_score || 0.95
      }
    };

    const { error: assetError } = await supabaseClient
      .from('tokenized_assets')
      .upsert(assetData, { 
        onConflict: 'metadata->source_device_id',
        ignoreDuplicates: false 
      });

    if (assetError) {
      console.error('Error creating tokenized asset:', assetError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Data processed successfully',
        metrics_count: refinedData.metrics.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in MES processing:', error);
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