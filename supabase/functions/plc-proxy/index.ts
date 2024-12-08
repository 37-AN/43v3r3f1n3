import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const upgrade = req.headers.get('upgrade') || ''
  if (upgrade.toLowerCase() != 'websocket') {
    return new Response('Expected websocket upgrade', { status: 400 })
  }

  try {
    const url = new URL(req.url)
    const targetHost = url.searchParams.get('host')
    const targetPort = url.searchParams.get('port')
    const protocol = url.searchParams.get('protocol') || 'modbus'

    if (!targetHost || !targetPort) {
      throw new Error('Missing host or port parameters')
    }

    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req)
    
    // Connect to PLC
    const plcSocket = new WebSocket(`ws://${targetHost}:${targetPort}`)

    plcSocket.onopen = () => {
      console.log(`Connected to PLC at ${targetHost}:${targetPort}`)
      clientSocket.send(JSON.stringify({ type: 'connected' }))
    }

    plcSocket.onmessage = (event) => {
      clientSocket.send(event.data)
    }

    plcSocket.onerror = (error) => {
      console.error(`PLC connection error:`, error)
      clientSocket.send(JSON.stringify({ type: 'error', message: 'PLC connection error' }))
    }

    clientSocket.onmessage = (event) => {
      if (plcSocket.readyState === WebSocket.OPEN) {
        plcSocket.send(event.data)
      }
    }

    clientSocket.onclose = () => {
      plcSocket.close()
    }

    return response
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})