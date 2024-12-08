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
    contract_address: string;
    blockchain: string;
    network: string;
  };
  created_at: string;
}