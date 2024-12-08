import React, { useEffect, useState } from 'react';
import { PLCData } from '@/utils/plcData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomOPCUAClient } from '@/utils/communication/opcuaClient';
import { toast } from 'sonner';

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
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="space-y-3">
            {Object.entries(connectionStatus).map(([deviceId, status]) => (
              <div key={deviceId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Device ({deviceId})</span>
                <Badge variant={status ? "success" : "destructive"} className="capitalize">
                  {status ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Real-time Data</h2>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {Object.entries(simulatedData).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium capitalize">{key}</span>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {value.toFixed(2)}
                  </span>
                </div>
              ))}
              {plcData && Object.entries(plcData).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{key}</span>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {value !== undefined && value !== null ? String(value) : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default Index;