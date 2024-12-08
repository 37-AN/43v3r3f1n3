import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PLCConnector, PLCDevice } from "@/utils/plcsimCommunication";
import { PLCData } from "@/utils/plcData";
import { toast } from "sonner";

export const usePLCData = (isAuthenticated: boolean) => {
  const [plcData, setPlcData] = useState<PLCData | null>(null);
  const [plcConnector, setPlcConnector] = useState<PLCConnector | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: boolean }>({});

  // Initialize PLC Connector
  useEffect(() => {
    const initializePLCConnector = async () => {
      if (isAuthenticated) {
        try {
          console.log('Checking authentication status...');
          const { data: { session } } = await supabase.auth.getSession();
          console.log('Current session:', session ? 'Active' : 'None');

          console.log('Fetching PLC device...');
          const { data: devices, error } = await supabase
            .from('plc_devices')
            .select('*')
            .eq('is_active', true);

          if (error) {
            console.error('Error fetching PLC devices:', error);
            toast.error("Failed to fetch PLC devices");
            throw error;
          }

          if (!devices || devices.length === 0) {
            console.log('No active PLC devices found in database');
            toast.warning("No active PLC devices found");
            return;
          }

          console.log('Retrieved PLC devices:', devices);
          
          // Initialize connector with devices
          const connector = new PLCConnector(devices as PLCDevice[]);
          console.log('Attempting to connect to PLC devices...');
          
          try {
            await connector.connect();
            console.log('Successfully connected to PLC devices');
            toast.success("Connected to PLC devices");
            setPlcConnector(connector);
          } catch (connError) {
            console.error('Error connecting to PLC devices:', connError);
            toast.error("Failed to connect to PLC devices");
            return;
          }
          
          const status = connector.getConnectionStatus();
          console.log('PLC Connection status:', status);
          setConnectionStatus(status);
        } catch (error) {
          console.error('Error in PLC initialization:', error);
          toast.error("Failed to initialize PLC connection");
        }
      }
    };

    initializePLCConnector();

    return () => {
      if (plcConnector) {
        console.log('Disconnecting from PLC devices...');
        plcConnector.disconnect();
      }
    };
  }, [isAuthenticated]);

  // Fetch PLC Data
  useEffect(() => {
    const fetchPLCData = async () => {
      if (!plcConnector || !isAuthenticated) {
        console.log('No PLC connector available or user not authenticated');
        return;
      }

      try {
        console.log('Reading PLC data...');
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
        console.log('Successfully read PLC data:', data);
        setPlcData(data);

        // Store PLC data in Supabase
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) {
          console.error('No access token available');
          return;
        }

        const entries = Object.entries(data).map(([key, value]) => {
          const [deviceId, address] = key.split('.');
          return {
            device_id: deviceId,
            data_type: typeof value,
            value: Number(value),
            metadata: { address }
          };
        });

        if (entries.length > 0) {
          console.log('Storing PLC data in database:', entries);
          const { error } = await supabase
            .from('arduino_plc_data')
            .insert(entries);

          if (error) {
            console.error('Error storing PLC data:', error);
            toast.error("Failed to store PLC data");
          }
        } else {
          console.log('No PLC data to store');
        }
      } catch (error) {
        console.error('Error fetching PLC data:', error);
        toast.error("Failed to fetch PLC data");
      }
    };

    const interval = setInterval(fetchPLCData, 5000);
    return () => clearInterval(interval);
  }, [plcConnector, isAuthenticated]);

  return { plcData, connectionStatus };
};
