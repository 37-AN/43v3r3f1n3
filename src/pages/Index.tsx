import React, { useEffect, useState } from 'react';
import { PLCData } from '@/utils/plcData';
import { CustomOPCUAClient } from '@/utils/communication/opcuaClient';
import { toast } from 'sonner';
import { ConnectionStatus } from '@/components/dashboard/ConnectionStatus';
import { RealTimeData } from '@/components/dashboard/RealTimeData';
import { OPCUAMetrics } from '@/components/opcua/OPCUAMetrics';
import { AIInsights } from '@/components/AIInsights';
import { supabase } from '@/integrations/supabase/client';

interface IndexProps {
  plcData: PLCData | null;
  connectionStatus: { [key: string]: boolean };
}

// Define OPC UA server endpoints
const OPC_UA_ENDPOINTS = {
  prosys: "opc.tcp://uademo.prosysopc.com:53530/OPCUA/SimulationServer",
  local: "opc.tcp://DESKTOP-3RVJI44.mshome.net:53530/OPCUA/SimulationServer"
};

// Define the node IDs for the variables we want to monitor
const NODE_IDS = {
  counter: "ns=3;s=Counter1",
  random: "ns=3;s=Random1",
  sinusoid: "ns=3;s=Sinusoid1"
};

const Index: React.FC<IndexProps> = ({ plcData, connectionStatus }) => {
  const [simulatedData, setSimulatedData] = useState<Record<string, number>>({});
  const [opcuaClients, setOpcuaClients] = useState<Record<string, CustomOPCUAClient>>({});
  const [deviceStatus, setDeviceStatus] = useState<Record<string, boolean>>({});
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  useEffect(() => {
    // Fetch first active device for AI insights
    const fetchFirstDevice = async () => {
      const { data, error } = await supabase
        .from('plc_devices')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (data) {
        setSelectedDeviceId(data.id);
      }
    };

    fetchFirstDevice();
  }, []);

  useEffect(() => {
    console.log('Initializing OPC UA connections...');
    const clients: Record<string, CustomOPCUAClient> = {};
    
    // Initialize connection status
    const initialStatus = Object.keys(OPC_UA_ENDPOINTS).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setDeviceStatus(initialStatus);
    
    // Create and connect clients
    Object.entries(OPC_UA_ENDPOINTS).forEach(([name, endpoint]) => {
      console.log(`Creating client for ${name} at ${endpoint}`);
      const options: {
        applicationName: string;
        serverUri?: string;
        connectionStrategy: {
          initialDelay: number;
          maxRetry: number;
        }
      } = {
        applicationName: "Industrial IoT Client",
        connectionStrategy: {
          initialDelay: 1000,
          maxRetry: 3
        }
      };
      
      if (name === 'prosys') {
        options.serverUri = "urn:UADEMO.prosysopc.com:OPCUA:SimulationServer";
      }
      
      clients[name] = new CustomOPCUAClient(endpoint, options);
    });
    
    setOpcuaClients(clients);

    // Connect and subscribe to each endpoint
    Object.entries(clients).forEach(async ([name, client]) => {
      try {
        console.log(`Attempting to connect to ${name}...`);
        await client.connect();
        
        // Subscribe to all nodes for this server
        for (const [nodeKey, nodeId] of Object.entries(NODE_IDS)) {
          console.log(`Subscribing to ${nodeKey} (${nodeId}) on ${name}`);
          await client.subscribe(nodeId, (dataValue) => {
            console.log(`Received data for ${name}.${nodeKey}:`, dataValue);
            setSimulatedData(prev => ({
              ...prev,
              [`${name}.${nodeKey}`]: dataValue.value.value as number
            }));
          });
        }

        // Update connection status
        setDeviceStatus(prev => ({
          ...prev,
          [name]: true
        }));

        toast.success(`Connected to ${name} endpoint`);
        console.log(`Successfully connected to ${name}`);
      } catch (error) {
        console.error(`Failed to connect to ${name} endpoint:`, error);
        setDeviceStatus(prev => ({
          ...prev,
          [name]: false
        }));
        toast.error(`Failed to connect to ${name} endpoint`);
      }
    });

    return () => {
      console.log('Cleaning up OPC UA connections...');
      Object.values(clients).forEach(client => {
        client.disconnect().catch(console.error);
      });
    };
  }, []);

  useEffect(() => {
    if (selectedDeviceId && Object.keys(simulatedData).length > 0) {
      const analyzeData = async () => {
        try {
          console.log('Analyzing data for device:', selectedDeviceId, 'Data:', simulatedData);
          
          const { data, error } = await supabase.functions.invoke('analyze-plc-data', {
            body: {
              deviceId: selectedDeviceId,
              data: simulatedData
            }
          });

          if (error) {
            console.error('Error analyzing data:', error);
            throw error;
          }

          console.log('Analysis result:', data);
        } catch (error) {
          console.error('Error analyzing data:', error);
          toast.error('Failed to analyze PLC data');
        }
      };

      // Analyze data every 30 seconds
      const analysisInterval = setInterval(analyzeData, 30000);
      return () => clearInterval(analysisInterval);
    }
  }, [selectedDeviceId, simulatedData]);

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-up">
      <h1 className="text-3xl font-bold mb-6">Manufacturing Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ConnectionStatus connectionStatus={deviceStatus} />
        <RealTimeData 
          simulatedData={simulatedData} 
          plcData={plcData} 
        />
      </div>

      {selectedDeviceId && (
        <div className="mt-6">
          <AIInsights deviceId={selectedDeviceId} />
        </div>
      )}

      <OPCUAMetrics simulatedData={simulatedData} />
    </div>
  );
};

export default Index;