import { Json } from "@/integrations/supabase/types";

export interface TokenizeFormData {
  name: string;
  description: string;
  tokenSymbol: string;
  totalSupply: string;
  pricePerToken: string;
  assetType: string;
}

export interface MESMetric {
  id: string;
  device_id: string;
  metric_type: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata: {
    quality_score: number;
    source: string;
    category: string;
  };
}

export interface TokenizedAsset {
  id: string;
  asset_type: string;
  name: string;
  description: string | null;
  token_symbol: string;
  total_supply: number;
  price_per_token: number;
  owner_id: string;
  created_at: string;
  metadata: Json | null;
}

export interface ComplianceStatus {
  symbol: string;
  status: boolean;
  lastChecked: Date;
}

export interface ResourceAllocation {
  symbol: string;
  userAddress: string;
  amount: number;
  timestamp: Date;
}