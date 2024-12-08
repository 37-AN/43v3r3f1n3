export interface PLCDevice {
  id: string;
  name: string;
  description?: string;
  ip_address?: string;
  port?: number;
  slave_id?: number;
  is_active?: boolean;
  protocol?: 'modbus' | 's7';
  rack?: number;
  slot?: number;
}