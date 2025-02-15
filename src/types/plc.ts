
export interface PLCData {
  [key: string]: number;
}

export interface PLCDevice {
  id: string;
  name: string;
  description?: string;
  ip_address: string;
  port: number;
  protocol: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
