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
    console.log('Received refined data in MES engine:', refinedData);

    // Enhanced deviceId validation
    if (!refinedData?.deviceId || typeof refinedData.deviceId !== 'string' || !refinedData.deviceId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('Invalid deviceId format:', refinedData?.deviceId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid deviceId format. Must be a valid UUID.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(refinedData.metrics) || refinedData.metrics.length === 0) {
      console.error('Invalid metrics format:', refinedData.metrics);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Metrics must be a non-empty array' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store MES metrics with enhanced validation
    const mesMetricsPromises = refinedData.metrics.map(metric => {
      if (!metric.metric_type || typeof metric.value !== 'number') {
        console.error('Invalid metric format:', metric);
        throw new Error('Invalid metric format');
      }

      const metricData = {
        device_id: refinedData.deviceId,
        metric_type: metric.metric_type,
        value: metric.value,
        unit: metric.unit || 'unit',
        timestamp: refinedData.timestamp || new Date().toISOString(),
        metadata: {
          quality_score: metric.quality_score || 0.95,
          source: refinedData.metadata?.source || 'mes_engine',
          source_device_id: refinedData.deviceId
        }
      };

      console.log('Storing MES metric:', metricData);
      return supabaseClient.from('mes_metrics').insert(metricData);
    });

    await Promise.all(mesMetricsPromises);

    // Create or update tokenized asset with proper validation
    const assetData = {
      asset_type: 'industrial_metric',
      name: `Device ${refinedData.deviceId} Metrics`,
      token_symbol: `MES_${refinedData.deviceId.slice(0, 8)}`,
      total_supply: 1000000,
      price_per_token: 0.001,
      metadata: {
        source_device_id: refinedData.deviceId,
        last_update: new Date().toISOString(),
        quality_score: refinedData.metrics[0]?.quality_score || 0.95
      }
    };

    console.log('Creating/updating tokenized asset:', assetData);
    const { error: assetError } = await supabaseClient
      .from('tokenized_assets')
      .upsert(assetData);

    if (assetError) {
      console.error('Error creating tokenized asset:', assetError);
      throw assetError;
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