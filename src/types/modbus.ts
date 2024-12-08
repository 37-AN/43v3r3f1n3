import { Json } from "@/integrations/supabase/types";

export type ModbusRegisterType = 'coil' | 'discrete' | 'input' | 'holding';

export interface ModbusRegister {
  address: number;
  value: number;
  type: ModbusRegisterType;
}

export interface ModbusTCPClient {
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: () => boolean;
  readCoils: (address: number, quantity: number) => Promise<any>;
  readInputRegisters: (address: number, quantity: number) => Promise<any>;
  readHoldingRegisters: (address: number, quantity: number) => Promise<any>;
}

// This is what we use for time series data display
export interface ModbusRegisterData {
  timestamp: string;
  value: number;
  registerType: ModbusRegisterType;
  address: number;
}

export interface ModbusSimulationConfig {
  port: number;
  slave_id: number;
  registers: ModbusRegister[];
}

// This type ensures compatibility with Supabase's Json type
export type ModbusSimulationParameters = {
  port: number;
  slave_id: number;
  registers: Array<{
    address: number;
    value: number;
    type: ModbusRegisterType;
  }>;
}

// Type guard to check if a JSON value is a valid simulation config
export function isModbusSimulationConfig(value: Json): value is ModbusSimulationParameters {
  if (!value || typeof value !== 'object') return false;
  
  const config = value as Partial<ModbusSimulationParameters>;
  return (
    typeof config.port === 'number' &&
    typeof config.slave_id === 'number' &&
    Array.isArray(config.registers) &&
    config.registers.every(reg => 
      typeof reg === 'object' &&
      typeof reg.address === 'number' &&
      typeof reg.value === 'number' &&
      typeof reg.type === 'string'
    )
  );
}