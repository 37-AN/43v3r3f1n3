
export interface PLCData {
  [key: string]: number;
}

export interface PLCDevice {
  id: string;
  name: string;
  description?: string;
  ip_address: string;
  port: number;
  protocol: 'modbus' | 's7';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  slave_id?: number;
  rack?: number;
  slot?: number;
}
