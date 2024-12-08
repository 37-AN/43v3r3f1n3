import { Json } from "@/integrations/supabase/types";

export interface ParameterRange {
  min: number;
  max: number;
}

export interface SimulationParameters {
  temperature: ParameterRange;
  pressure: ParameterRange;
  vibration: ParameterRange;
  production_rate: ParameterRange;
  downtime_minutes: ParameterRange;
  defect_rate: ParameterRange;
  energy_consumption: ParameterRange;
  machine_efficiency: ParameterRange;
}

export interface DeviceSimulation {
  id: string;
  device_id: string;
  is_running: boolean;
  parameters: Json;
  simulation_type: string;
}

export const defaultParameters: SimulationParameters = {
  temperature: { min: 20, max: 80 },
  pressure: { min: 0, max: 100 },
  vibration: { min: 0, max: 50 },
  production_rate: { min: 50, max: 200 },
  downtime_minutes: { min: 0, max: 60 },
  defect_rate: { min: 0, max: 5 },
  energy_consumption: { min: 50, max: 150 },
  machine_efficiency: { min: 70, max: 100 }
};

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
  const requiredKeys = [
    'temperature',
    'pressure',
    'vibration',
    'production_rate',
    'downtime_minutes',
    'defect_rate',
    'energy_consumption',
    'machine_efficiency'
  ];
  
  return requiredKeys.every(key => 
    key in p && 
    typeof p[key as keyof SimulationParameters] === 'object' &&
    'min' in (p[key as keyof SimulationParameters] || {}) &&
    'max' in (p[key as keyof SimulationParameters] || {})
  );
}