import { ethers } from 'ethers';
import { toast } from "sonner";

export async function initializeBlockchainConnection() {
  try {
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Please install MetaMask to use blockchain features');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    console.log('Blockchain connection initialized with address:', await signer.getAddress());
    return { provider, signer };
  } catch (error) {
    console.error('Failed to initialize blockchain connection:', error);
    toast.error('Failed to connect to blockchain. Please ensure MetaMask is installed and connected.');
    return null;
  }
}

export async function tokenizeAsset(
  assetData: {
    name: string;
    symbol: string;
    totalSupply: number;
    assetType: string;
  },
  signer: ethers.Signer
) {
  try {
    console.log('Tokenizing asset:', assetData);
    // Here we would deploy the smart contract
    // This is a placeholder for the actual contract deployment
    const tokenAddress = '0x...'; // This would be the deployed contract address
    
    // Store the token information in Supabase
    const { data, error } = await supabase
      .from('tokenized_assets')
      .insert([
        {
          asset_type: assetData.assetType,
          name: assetData.name,
          token_symbol: assetData.symbol,
          total_supply: assetData.totalSupply,
          owner_id: (await supabase.auth.getUser()).data.user?.id,
          metadata: {
            contract_address: tokenAddress,
            blockchain: 'ethereum',
            network: 'testnet'
          }
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    console.log('Asset tokenized successfully:', data);
    toast.success('Asset tokenized successfully');
    return data;
  } catch (error) {
    console.error('Failed to tokenize asset:', error);
    toast.error('Failed to tokenize asset');
    throw error;
  }
}