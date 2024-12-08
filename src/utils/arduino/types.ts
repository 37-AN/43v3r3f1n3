export interface ArduinoPLCDataPoint {
  timestamp: string;
  value: number;
  data_type: string;
  device_id: string;
}

export interface ProcessedArduinoData {
  originalData: ArduinoPLCDataPoint[];
  refinedData: ArduinoPLCDataPoint[];
  anomalies: ArduinoPLCDataPoint[];
  insights: {
    efficiency: number;
    stability: number;
    recommendations: string[];
  };
}