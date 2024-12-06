export type ModbusRegisterType = 'coil' | 'discrete' | 'input' | 'holding';

export interface ModbusRegister {
  address: number;
  value: number;
  type: ModbusRegisterType;
}

export interface ModbusSimulationConfig {
  port: number;
  slave_id: number;
  registers: ModbusRegister[];
}

export interface SimulationParameters {
  port: number;
  slave_id: number;
  registers: ModbusRegister[];
}