import React, { useEffect, useState } from 'react';
import { PLCData } from '@/utils/plcData';
import { CustomOPCUAClient, OPCUAClientOptions } from '@/utils/communication/opcuaClient';
import { supabase } from '@/integrations/supabase/client';
import { OPCUAMetrics } from '@/components/opcua/OPCUAMetrics';
import { AIInsights } from '@/components/AIInsights';
import { DataAnalyzer } from '@/components/analysis/DataAnalyzer';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';

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
      const clientOptions: OPCUAClientOptions = {
        applicationName: "Industrial IoT Client",
        connectionStrategy: {
          initialDelay: 1000,
          maxRetry: 3
        }
      };
      
      if (name === 'prosys') {
        clientOptions.serverUri = "urn:UADEMO.prosysopc.com:OPCUA:SimulationServer";
      }
      
      clients[name] = new CustomOPCUAClient(endpoint, clientOptions);
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

        setDeviceStatus(prev => ({
          ...prev,
          [name]: true
        }));

        console.log(`Successfully connected to ${name}`);
      } catch (error) {
        console.error(`Failed to connect to ${name} endpoint:`, error);
        setDeviceStatus(prev => ({
          ...prev,
          [name]: false
        }));
      }
    });

    return () => {
      console.log('Cleaning up OPC UA connections...');
      Object.values(clients).forEach(client => {
        client.disconnect().catch(console.error);
      });
    };
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-up">
      <DashboardHeader title="Manufacturing Dashboard" />
      
      <DashboardGrid 
        deviceStatus={deviceStatus}
        simulatedData={simulatedData}
        plcData={plcData}
      />

      {selectedDeviceId && (
        <>
          <AIInsights deviceId={selectedDeviceId} />
          <DataAnalyzer 
            selectedDeviceId={selectedDeviceId}
            simulatedData={simulatedData}
          />
        </>
      )}

      <OPCUAMetrics simulatedData={simulatedData} />
    </div>
  );
};

export default Index;