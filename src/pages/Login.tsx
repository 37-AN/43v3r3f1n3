import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { Wallet, Database, Shield } from 'lucide-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function Login() {
  const navigate = useNavigate();
  const { connect, isConnecting } = useWeb3();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        console.log("User authenticated, redirecting to home");
        navigate("/");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-system-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Data Refinement Platform
          </h1>
          <p className="text-sm text-gray-600">
            Enterprise-grade data annotation and quality control
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600">Data Processing</p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-xs text-gray-600">Quality Control</p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600">Web3 Ready</p>
            </div>
          </div>
          
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

        <p className="text-center text-sm text-gray-600">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}