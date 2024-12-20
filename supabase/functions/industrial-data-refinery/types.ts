export interface Metric {
  metric_type: string;
  value: number;
  timestamp?: string;
  unit?: string;
  metadata?: {
    quality_score: number;
    source: string;
    error_state?: string | null;
    [key: string]: any;
  };
}

export interface RawData {
  deviceId: string;
  metrics: Metric[];
  timestamp: string;
  metadata: {
    simulation?: boolean;
    source: string;
    quality_score: number;
    owner_id: string;
    machine_state?: string;
    [key: string]: any;
  };
}

export interface RequestBody {
  rawData: RawData;
}

export interface Analysis {
  message: string;
  severity: "info" | "warning" | "critical";
  confidence: number;
}