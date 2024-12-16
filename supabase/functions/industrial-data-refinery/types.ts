export interface Metric {
  metric_type: string;
  value: number;
  timestamp: string;
  unit: string;
  metadata: {
    quality_score: number;
    source: string;
    [key: string]: any;
  };
}

export interface RawData {
  deviceId: string;
  metrics: Metric[];
  timestamp: string;
  metadata: {
    source: string;
    quality_score: number;
    owner_id: string;
    simulation?: boolean;
    [key: string]: any;
  };
}

export interface RequestBody {
  rawData: RawData;
}

export interface Analysis {
  message: string;
  severity: string;
  confidence: number;
}