import React, { useEffect, useState } from 'react';
import { PLCData } from '@/utils/plcData';
import { CustomOPCUAClient } from '@/utils/communication/opcuaClient';
import { toast } from 'sonner';
import { ConnectionStatus } from '@/components/dashboard/ConnectionStatus';
import { RealTimeData } from '@/components/dashboard/RealTimeData';

interface IndexProps {
  plcData: PLCData | null;
  connectionStatus: { [key: string]: boolean };
}

// Simulated OPC UA server endpoints
const DEMO_ENDPOINTS = {
  temperature: "opc.tcp://localhost:4840/temperature",
  pressure: "opc.tcp://localhost:4840/pressure",
  speed: "opc.tcp://localhost:4840/speed"
};

const Index: React.FC<IndexProps> = ({ plcData, connectionStatus }) => {
  const [simulatedData, setSimulatedData] = useState<Record<string, number>>({});
  const [opcuaClients, setOpcuaClients] = useState<Record<string, CustomOPCUAClient>>({});

  useEffect(() => {
    // Initialize OPC UA clients
    const clients: Record<string, CustomOPCUAClient> = {};
    
    Object.entries(DEMO_ENDPOINTS).forEach(([name, endpoint]) => {
      clients[name] = new CustomOPCUAClient(endpoint);
    });
    
    setOpcuaClients(clients);

    // Connect to each endpoint
    Object.entries(clients).forEach(async ([name, client]) => {
      try {
        await client.connect();
        
        // Subscribe to value changes
        await client.subscribe(name, (dataValue) => {
          setSimulatedData(prev => ({
            ...prev,
            [name]: dataValue.value.value as number
          }));
        });
      } catch (error) {
        console.error(`Failed to connect to ${name} endpoint:`, error);
        toast.error(`Failed to connect to ${name} endpoint`);
      }
    });

    // Cleanup
    return () => {
      Object.values(clients).forEach(client => {
        client.disconnect().catch(console.error);
      });
    };
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Manufacturing Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ConnectionStatus connectionStatus={connectionStatus} />
        <RealTimeData simulatedData={simulatedData} plcData={plcData} />
      </div>
    </div>
  );
};

export default Index;