export interface TokenizeFormData {
  name: string;
  description: string;
  tokenSymbol: string;
  totalSupply: string;
  pricePerToken: string;
  assetType: string;
}

export interface TokenizedAsset {
  id: string;
  name: string;
  description?: string;
  tokenSymbol: string;
  totalSupply: number;
  pricePerToken: number;
  assetType: string;
  metadata?: {
    contract_address?: string;
    transaction_hash?: string;
    blockchain?: string;
    network?: string;
  } | null;
  created_at: string;
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