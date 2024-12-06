import { Json } from "@/integrations/supabase/types";

export interface SimulationParameters {
  port: number;
  slave_id: number;
  registers: Array<{
    address: number;
    value: number;
  }>;
}

export interface DeviceSimulation {
  device_id: string;
  is_running: boolean;
  parameters: Json;
  simulation_type: string;
}

// Type guards
export function isValidSimulationPayload(payload: unknown): payload is DeviceSimulation {
  if (!payload || typeof payload !== 'object') return false;
  
  const p = payload as Partial<DeviceSimulation>;
  return (
    typeof p.device_id === 'string' &&
    typeof p.is_running === 'boolean' &&
    p.parameters !== undefined
  );
}

export function isValidSimulationParameters(params: unknown): params is SimulationParameters {
  if (!params || typeof params !== 'object') return false;
  
  const p = params as Partial<SimulationParameters>;
  return (
    typeof p.port === 'number' &&
    typeof p.slave_id === 'number' &&
    Array.isArray(p.registers) &&
    p.registers.every(reg => 
      typeof reg === 'object' &&
      reg !== null &&
      'address' in reg &&
      'value' in reg &&
      typeof reg.address === 'number' &&
      typeof reg.value === 'number'
    )
  );
}