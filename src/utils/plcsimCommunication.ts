import type { PLCDevice } from '@/types/plc';
import { PLCData } from './plcData';
import { ModbusClient } from './communication/modbusClient';
import { S7Client } from './communication/s7Client';

export type { PLCDevice };

export class PLCConnector {
  private modbusClients: Map<string, ModbusClient> = new Map();
  private s7Clients: Map<string, S7Client> = new Map();
  private connectionStatus: { [key: string]: boolean } = {};

  constructor(private devices: PLCDevice[]) {
    console.log('Initializing PLCConnector with devices:', devices);
    // Initialize connection status for all devices as false
    devices.forEach(device => {
      this.connectionStatus[device.id] = false;
    });
  }

  async connect(): Promise<void> {
    console.log('Starting connection process for all devices...');
    
    for (const device of this.devices) {
      try {
        if (!device.ip_address) {
          console.warn(`Device ${device.name} (${device.id}) has no IP address`);
          this.connectionStatus[device.id] = false;
          continue;
        }

        if (device.protocol === 'modbus') {
          console.log(`Connecting to Modbus device ${device.name} at ${device.ip_address}:${device.port}`);
          const client = new ModbusClient(
            device.ip_address, 
            device.port || 502, 
            device.slave_id || 1
          );
          await client.connect();
          this.modbusClients.set(device.id, client);
          this.connectionStatus[device.id] = true;
          console.log(`Successfully connected to Modbus device ${device.name}`);
        } else if (device.protocol === 's7') {
          console.log(`Connecting to S7 device ${device.name} at ${device.ip_address}`);
          const client = new S7Client(
            device.ip_address, 
            device.rack || 0, 
            device.slot || 1
          );
          await client.connect();
          this.s7Clients.set(device.id, client);
          this.connectionStatus[device.id] = true;
          console.log(`Successfully connected to S7 device ${device.name}`);
        }
      } catch (error) {
        console.error(`Error connecting to device ${device.name} (${device.id}):`, error);
        this.connectionStatus[device.id] = false;
      }
    }
    
    console.log('Final connection status:', this.connectionStatus);
  }

  async readData(dataBlocks: {
    deviceId: string;
    address: number;
    quantity: number;
    type: 'coil' | 'input' | 'holding' | 's7';
    dbNumber?: number;
    area?: string;
    s7Type?: string;
  }[]): Promise<PLCData> {
    const result: PLCData = {};

    for (const block of dataBlocks) {
      try {
        if (block.type === 's7') {
          const client = this.s7Clients.get(block.deviceId);
          if (!client) {
            console.warn(`No S7 client found for device ${block.deviceId}`);
            continue;
          }

          if (!this.connectionStatus[block.deviceId]) {
            console.warn(`Device ${block.deviceId} is not connected`);
            continue;
          }

          const s7Data = await client.readData([{
            area: block.area || 'DB',
            dbNumber: block.dbNumber || 1,
            start: block.address,
            amount: block.quantity,
            type: block.s7Type || 'INT'
          }]);

          result[`${block.deviceId}.${block.address}`] = s7Data[`var0`];
        } else {
          const client = this.modbusClients.get(block.deviceId);
          if (!client) {
            console.warn(`No Modbus client found for device ${block.deviceId}`);
            continue;
          }

          if (!this.connectionStatus[block.deviceId]) {
            console.warn(`Device ${block.deviceId} is not connected`);
            continue;
          }

          let response: any;
          switch (block.type) {
            case 'coil':
              response = await client.readCoils(block.address, block.quantity);
              break;
            case 'input':
              response = await client.readInputRegisters(block.address, block.quantity);
              break;
            case 'holding':
              response = await client.readHoldingRegisters(block.address, block.quantity);
              break;
          }

          if (response?.response?.body) {
            const values = response.response.body.values;
            if (Array.isArray(values) && values.length > 0) {
              result[`${block.deviceId}.${block.address}`] = values[0];
            }
          }
        }
      } catch (error) {
        console.error(`Error reading from device ${block.deviceId}, address ${block.address}:`, error);
      }
    }

    return result;
  }

  disconnect(): void {
    console.log('Disconnecting from all devices...');
    this.modbusClients.forEach((client, deviceId) => {
      try {
        client.disconnect();
        this.connectionStatus[deviceId] = false;
      } catch (error) {
        console.error(`Error disconnecting Modbus client ${deviceId}:`, error);
      }
    });
    this.s7Clients.forEach((client, deviceId) => {
      try {
        client.disconnect();
        this.connectionStatus[deviceId] = false;
      } catch (error) {
        console.error(`Error disconnecting S7 client ${deviceId}:`, error);
      }
    });
    this.modbusClients.clear();
    this.s7Clients.clear();
  }

  getConnectionStatus(): { [key: string]: boolean } {
    return { ...this.connectionStatus };
  }
}