import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { Wallet } from 'lucide-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function Login() {
  const navigate = useNavigate();
  const { connect, isConnecting } = useWeb3();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        console.log("User is authenticated, redirecting to home");
        navigate("/");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-system-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-center mb-6">Welcome Back</h1>
        
        <Button 
          className="w-full flex items-center justify-center gap-2" 
          onClick={connect}
          disabled={isConnecting}
        >
          <Wallet className="w-4 h-4" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: {
                background: 'rgb(var(--primary))',
                color: 'white',
                borderRadius: '0.5rem'
              },
              anchor: {
                color: 'rgb(var(--primary))'
              }
            }
          }}
          providers={[]}
        />
      </div>
    </div>
  );
}