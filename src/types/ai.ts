export interface AIInsight {
  id: string;
  device_id: string;
  insight_type: string;
  message: string;
  confidence: number;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
  metadata: Record<string, any>;
}