import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import TokenizedAssets from "./pages/TokenizedAssets";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PLCConnector } from "@/utils/plcsimCommunication";
import { PLCData } from "@/utils/plcData";
import { toast } from "@/components/ui/use-toast";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [plcData, setPlcData] = useState<PLCData | null>(null);
  const [plcConnector, setPlcConnector] = useState<PLCConnector | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial auth check:", session ? "authenticated" : "not authenticated");
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session ? "authenticated" : "not authenticated");
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const initializePLCConnector = async () => {
      if (isAuthenticated) {
        try {
          const { data: devices, error } = await supabase
            .from('plc_devices')
            .select('*')
            .eq('is_active', true);

          if (error) throw error;

          const connector = new PLCConnector(devices);
          await connector.connect();
          setPlcConnector(connector);
          
          // Check and set connection status
          const status = connector.getConnectionStatus();
          setConnectionStatus(status);
        } catch (error) {
          console.error('Error initializing PLC connector:', error);
          toast({
            title: "Error",
            description: "Failed to initialize PLC connection",
            variant: "destructive",
          });
        }
      }
    };

    initializePLCConnector();

    return () => {
      if (plcConnector) {
        plcConnector.disconnect();
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchPLCData = async () => {
      if (plcConnector) {
        try {
          const dataBlocks = [
            { deviceId: 'e2fae487-1ee2-4ea2-b87f-decedb7d12a5', address: 0, quantity: 1, type: 'holding' as const },
            { deviceId: 'e2fae487-1ee2-4ea2-b87f-decedb7d12a5', address: 1, quantity: 1, type: 'holding' as const },
            { deviceId: '7f8d6e5a-9c4b-3a2d-1f0e-8b7a6c5d4e3f', address: 0, quantity: 1, type: 'holding' as const },
            { deviceId: '7f8d6e5a-9c4b-3a2d-1f0e-8b7a6c5d4e3f', address: 1, quantity: 1, type: 'holding' as const },
            { 
              deviceId: 'plcsim-v17', 
              address: 0, 
              quantity: 1, 
              type: 's7' as const,
              dbNumber: 1,
              area: 'DB',
              s7Type: 'INT'
            },
            { 
              deviceId: 'plcsim-v17', 
              address: 2, 
              quantity: 1, 
              type: 's7' as const,
              dbNumber: 1,
              area: 'DB',
              s7Type: 'REAL'
            }
          ];

          const data = await plcConnector.readData(dataBlocks);
          setPlcData(data);

          // Store PLC data in Supabase
          for (const [key, value] of Object.entries(data)) {
            const [deviceId, address] = key.split('.');
            const { error } = await supabase
              .from('arduino_plc_data')
              .insert({
                device_id: deviceId,
                data_type: typeof value,
                value: Number(value),
                timestamp: new Date().toISOString(),
                metadata: JSON.stringify({ address })
              });
            if (error) throw error;
          }
        } catch (error) {
          console.error('Error fetching PLC data:', error);
          toast({
            title: "Error",
            description: "Failed to fetch PLC data",
            variant: "destructive",
          });
        }
      }
    };

    const interval = setInterval(fetchPLCData, 5000); // Fetch data every 5 seconds

    return () => clearInterval(interval);
  }, [plcConnector]);

  if (isAuthenticated === null) {
    return null; // Initial loading state
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Index plcData={plcData} connectionStatus={connectionStatus} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <Login />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/tokenized-assets"
              element={
                isAuthenticated ? (
                  <TokenizedAssets />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

