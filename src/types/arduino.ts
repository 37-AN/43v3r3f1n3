export interface ArduinoPLCData {
  id: string;
  device_id: string;
  data_type: string;
  value: number;
  timestamp: string;
  plc_devices: {
    name: string;
  } | null;
}