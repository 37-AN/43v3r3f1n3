import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Web3Provider as EthersWeb3Provider } from '@ethersproject/providers';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Web3ContextType {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  account: string | null;
  isConnecting: boolean;
  provider: EthersWeb3Provider | null;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<EthersWeb3Provider | null>(null);
  const navigate = useNavigate();

  const connect = async () => {
    try {
      setIsConnecting(true);
      
      if (!window.ethereum) {
        toast.error('Please install MetaMask to connect with your wallet');
        return;
      }

      const ethersProvider = new EthersWeb3Provider(window.ethereum);
      const accounts = await ethersProvider.send('eth_requestAccounts', []);
      const account = accounts[0];
      
      // Sign message to verify wallet ownership
      const message = `Sign this message to authenticate with our app: ${Date.now()}`;
      const signature = await ethersProvider.getSigner().signMessage(message);
      
      // Authenticate with Supabase using the wallet signature
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'metamask' as any, // Using type assertion as temporary fix
        options: {
          queryParams: {
            wallet_address: account,
            signature: signature,
            signed_message: message
          }
        }
      });

      if (error) throw error;

      setAccount(account);
      setProvider(ethersProvider);
      navigate('/');
      toast.success('Successfully connected wallet');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await supabase.auth.signOut();
      setAccount(null);
      setProvider(null);
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  useEffect(() => {
    // Check if user was previously connected
    const checkConnection = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.provider === 'metamask') {
        const ethersProvider = new EthersWeb3Provider(window.ethereum);
        const accounts = await ethersProvider.listAccounts();
        if (accounts[0]) {
          setAccount(accounts[0]);
          setProvider(ethersProvider);
        }
      }
    };

    checkConnection();
  }, []);

  return (
    <Web3Context.Provider value={{ connect, disconnect, account, isConnecting, provider }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};