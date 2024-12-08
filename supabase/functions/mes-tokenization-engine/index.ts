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
    const { refinedData, timestamp } = await req.json();
    console.log('Received refined data for MES tokenization:', refinedData);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate MES metrics from refined data
    const mesMetrics = {
      device_id: refinedData.deviceId,
      metric_type: 'performance',
      value: refinedData.value,
      unit: refinedData.metadata?.unit || 'unit',
      timestamp: timestamp,
      metadata: {
        quality_score: refinedData.qualityScore,
        source: 'ai_refinery',
        ...refinedData.metadata
      }
    };

    // Store MES metrics
    const { error: metricsError } = await supabaseClient
      .from('mes_metrics')
      .insert(mesMetrics);

    if (metricsError) {
      console.error('Error storing MES metrics:', metricsError);
      throw new Error('Failed to store MES metrics');
    }

    // Create tokenization record if quality score is above threshold
    if (refinedData.qualityScore >= 0.8) {
      const tokenData = {
        asset_type: 'industrial_data',
        name: `${refinedData.dataType}_${timestamp}`,
        description: `Tokenized industrial data for ${refinedData.dataType}`,
        token_symbol: 'IND',
        owner_id: refinedData.metadata?.owner_id,
        metadata: {
          source_data: refinedData,
          timestamp,
          quality_score: refinedData.qualityScore
        }
      };

      const { error: tokenError } = await supabaseClient
        .from('tokenized_assets')
        .insert(tokenData);

      if (tokenError) {
        console.error('Error creating token:', tokenError);
        throw new Error('Failed to create token');
      }
    }

    console.log('Successfully processed data in MES engine');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Data processed and tokenized successfully'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
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
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});