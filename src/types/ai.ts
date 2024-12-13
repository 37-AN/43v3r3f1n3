import { Json } from "@/integrations/supabase/types";

export interface AIInsight {
  id: string;
  device_id: string | null;
  insight_type: string;
  message: string;
  confidence: number | null;
  severity: 'info' | 'warning' | 'critical';
  created_at: string | null;
  metadata: Record<string, any>;
}

export interface InsightMetadata {
  type?: string;
  efficiency?: number;
  stability?: number;
  [key: string]: any;
}