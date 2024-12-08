import React, { useEffect, useState } from 'react';
import { PLCData } from '@/utils/plcData';
import { CustomOPCUAClient } from '@/utils/communication/opcuaClient';
import { toast } from 'sonner';
import { ConnectionStatus } from '@/components/dashboard/ConnectionStatus';
import { RealTimeData } from '@/components/dashboard/RealTimeData';
import { OPCUAMetrics } from '@/components/opcua/OPCUAMetrics';

interface IndexProps {
  plcData: PLCData | null;
  connectionStatus: { [key: string]: boolean };
}

const DEMO_ENDPOINTS = {
  temperature: "opc.tcp://localhost:4840/temperature",
  pressure: "opc.tcp://localhost:4840/pressure",
  speed: "opc.tcp://localhost:4840/speed"
};

const Index: React.FC<IndexProps> = ({ plcData, connectionStatus }) => {
  const [simulatedData, setSimulatedData] = useState<Record<string, number>>({});
  const [opcuaClients, setOpcuaClients] = useState<Record<string, CustomOPCUAClient>>({});

  useEffect(() => {
    const clients: Record<string, CustomOPCUAClient> = {};
    
    Object.entries(DEMO_ENDPOINTS).forEach(([name, endpoint]) => {
      clients[name] = new CustomOPCUAClient(endpoint);
    });
    
    setOpcuaClients(clients);

    Object.entries(clients).forEach(async ([name, client]) => {
      try {
        await client.connect();
        
        await client.subscribe(name, (dataValue) => {
          setSimulatedData(prev => ({
            ...prev,
            [name]: dataValue.value.value as number
          }));
        });

        toast.success(`Connected to ${name} endpoint`);
      } catch (error) {
        console.error(`Failed to connect to ${name} endpoint:`, error);
        toast.error(`Failed to connect to ${name} endpoint`);
      }
    });

    return () => {
      Object.values(clients).forEach(client => {
        client.disconnect().catch(console.error);
      });
    };
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-up">
      <h1 className="text-3xl font-bold mb-6">Manufacturing Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ConnectionStatus connectionStatus={connectionStatus} />
        <RealTimeData 
          simulatedData={simulatedData} 
          plcData={plcData} 
        />
      </div>

      <OPCUAMetrics simulatedData={simulatedData} />
    </div>
  );
};

export default Index;