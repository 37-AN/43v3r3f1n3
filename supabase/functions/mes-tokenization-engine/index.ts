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
    console.log('Received refined data:', refinedData);

    // Validate required fields
    if (!refinedData?.deviceId || !refinedData?.metrics || !Array.isArray(refinedData.metrics)) {
      console.error('Invalid refined data structure:', refinedData);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or missing refined data' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store MES metrics with validation
    const mesMetricsPromises = refinedData.metrics.map(metric => {
      const metricData = {
        device_id: refinedData.deviceId,
        metric_type: metric.metric_type || 'unknown',
        value: typeof metric.value === 'number' ? metric.value : 0,
        unit: metric.unit || 'unit',
        timestamp: metric.timestamp || refinedData.timestamp || new Date().toISOString(),
        metadata: {
          quality_score: metric.quality_score || 0.95,
          source: refinedData.metadata?.source || 'mes_engine',
          source_device_id: refinedData.deviceId,
          category: metric.category || 'measurement'
        }
      };

      console.log('Storing metric:', metricData);
      return supabaseClient.from('mes_metrics').insert(metricData);
    });

    await Promise.all(mesMetricsPromises);
    console.log('Successfully stored MES metrics');

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