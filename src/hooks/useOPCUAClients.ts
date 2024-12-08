import { useState, useEffect } from 'react';
import { CustomOPCUAClient, OPCUAClientOptions } from '@/utils/communication/opcuaClient';
import { OPC_UA_ENDPOINTS, NODE_IDS } from '@/config/opcuaConfig';

export const useOPCUAClients = () => {
  const [simulatedData, setSimulatedData] = useState<Record<string, number>>({});
  const [opcuaClients, setOpcuaClients] = useState<Record<string, CustomOPCUAClient>>({});
  const [deviceStatus, setDeviceStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    console.log('Initializing OPC UA connections...');
    const clients: Record<string, CustomOPCUAClient> = {};
    
    const initialStatus = Object.keys(OPC_UA_ENDPOINTS).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setDeviceStatus(initialStatus);
    
    Object.entries(OPC_UA_ENDPOINTS).forEach(([name, endpoint]) => {
      console.log(`Creating client for ${name} at ${endpoint}`);
      const clientOptions: OPCUAClientOptions = {
        applicationName: "Industrial IoT Client",
        connectionStrategy: {
          initialDelay: 1000,
          maxRetry: 3
        }
      };
      
      clients[name] = new CustomOPCUAClient(endpoint, clientOptions);
    });
    
    setOpcuaClients(clients);

    Object.entries(clients).forEach(async ([name, client]) => {
      try {
        console.log(`Attempting to connect to ${name}...`);
        await client.connect();
        
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

  return { simulatedData, deviceStatus };
};