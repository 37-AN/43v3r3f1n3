import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestData = await req.json()
    console.log('Received industrial data:', requestData)

    // Validate request data
    if (!requestData.deviceId || !requestData.metrics || !Array.isArray(requestData.metrics)) {
      console.error('Invalid request data structure')
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: 'deviceId and metrics array are required'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Process and refine each metric
    const refinedMetrics = requestData.metrics.map((metric: any) => {
      // Apply data refinement logic
      const refinedValue = normalizeValue(metric.value, metric.type)
      const qualityScore = calculateQualityScore(metric)

      return {
        device_id: requestData.deviceId,
        data_type: metric.type,
        value: refinedValue,
        quality_score: qualityScore,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metric.metadata,
          refined: true,
          original_value: metric.value,
          refinement_timestamp: new Date().toISOString()
        }
      }
    })

    console.log('Refined metrics:', refinedMetrics)

    // Store refined data
    const { error: storageError } = await supabaseAdmin
      .from('refined_industrial_data')
      .insert(refinedMetrics)

    if (storageError) {
      console.error('Error storing refined data:', storageError)
      throw storageError
    }

    // Store raw data for historical purposes
    const rawDataEntries = requestData.metrics.map((metric: any) => ({
      device_id: requestData.deviceId,
      data_type: metric.type,
      value: metric.value,
      timestamp: new Date().toISOString(),
      metadata: metric.metadata || {}
    }))

    const { error: rawStorageError } = await supabaseAdmin
      .from('arduino_plc_data')
      .insert(rawDataEntries)

    if (rawStorageError) {
      console.error('Error storing raw data:', rawStorageError)
      // Don't throw here, as refined data was already stored successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data processed and stored successfully',
        refinedMetrics
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing industrial data:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper functions for data refinement
function normalizeValue(value: number, type: string): number {
  const thresholds: Record<string, { min: number; max: number }> = {
    temperature: { min: -20, max: 120 },
    pressure: { min: 0, max: 1000 },
    vibration: { min: 0, max: 100 },
    flow_rate: { min: 0, max: 500 },
    humidity: { min: 0, max: 100 },
    speed: { min: 0, max: 10000 },
    current: { min: 0, max: 100 },
    voltage: { min: 0, max: 480 }
  }

  const range = thresholds[type] || { min: -Infinity, max: Infinity }
  return Math.max(range.min, Math.min(range.max, value))
}

function calculateQualityScore(metric: any): number {
  let score = 1.0

  // Check for missing metadata
  if (!metric.metadata) score -= 0.1

  // Check for value within expected ranges
  const normalizedValue = normalizeValue(metric.value, metric.type)
  if (normalizedValue !== metric.value) score -= 0.2

  // Check for timestamp freshness
  if (metric.timestamp) {
    const age = Date.now() - new Date(metric.timestamp).getTime()
    if (age > 60000) score -= 0.1 // Penalize data older than 1 minute
  } else {
    score -= 0.1
  }

  return Math.max(0, Math.min(1, score))
}