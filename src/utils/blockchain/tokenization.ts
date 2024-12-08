import { ethers } from 'ethers';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import IndustrialAssetTokenABI from '@/contracts/IndustrialAssetToken.json';

// Deployed to Sepolia testnet
const CONTRACT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

export async function initializeBlockchainConnection() {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Please install MetaMask to use blockchain features');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    console.log('Blockchain connection initialized with address:', await signer.getAddress());
    
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      IndustrialAssetTokenABI.abi,
      signer
    );

    return { provider, signer, contract };
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
    description: string;
    pricePerToken: number;
  },
  signer: ethers.Signer
) {
  try {
    console.log('Tokenizing asset:', assetData);
    
    const connection = await initializeBlockchainConnection();
    if (!connection?.contract) {
      throw new Error('Blockchain connection not initialized');
    }

    const tx = await connection.contract.tokenizeAsset(
      assetData.symbol,
      assetData.assetType,
      assetData.description,
      ethers.parseUnits(assetData.totalSupply.toString(), 18),
      ethers.parseUnits(assetData.pricePerToken.toString(), 18)
    );

    console.log('Transaction sent:', tx.hash);
    await tx.wait();
    console.log('Transaction confirmed');

    // Store the token information in Supabase
    const { data, error } = await supabase
      .from('tokenized_assets')
      .insert({
        asset_type: assetData.assetType,
        name: assetData.name,
        description: assetData.description,
        token_symbol: assetData.symbol,
        total_supply: assetData.totalSupply,
        price_per_token: assetData.pricePerToken,
        owner_id: (await supabase.auth.getUser()).data.user?.id,
        metadata: {
          contract_address: CONTRACT_ADDRESS,
          transaction_hash: tx.hash,
          blockchain: 'ethereum',
          network: 'testnet'
        }
      })
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

export async function checkCompliance(symbol: string) {
  try {
    const connection = await initializeBlockchainConnection();
    if (!connection?.contract) {
      throw new Error('Blockchain connection not initialized');
    }

    const assetDetails = await connection.contract.getAssetDetails(symbol);
    return assetDetails.complianceStatus;
  } catch (error) {
    console.error('Failed to check compliance:', error);
    throw error;
  }
}

export async function allocateResource(symbol: string, userAddress: string, amount: number) {
  try {
    const connection = await initializeBlockchainConnection();
    if (!connection?.contract) {
      throw new Error('Blockchain connection not initialized');
    }

    const tx = await connection.contract.allocateResource(
      symbol,
      userAddress,
      ethers.parseUnits(amount.toString(), 18)
    );

    await tx.wait();
    toast.success('Resource allocated successfully');
  } catch (error) {
    console.error('Failed to allocate resource:', error);
    toast.error('Failed to allocate resource');
    throw error;
  }
}