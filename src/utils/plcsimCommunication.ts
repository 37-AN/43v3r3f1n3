import net from 'net';
import { PLCData } from './plcData';
import { S7Communication } from './s7Communication';

interface ModbusTCPClient {
  socket: net.Socket;
  readCoils(address: number, quantity: number): Promise<any>;
  readInputRegisters(address: number, quantity: number): Promise<any>;
  readHoldingRegisters(address: number, quantity: number): Promise<any>;
}

export interface PLCDevice {
  id: string;
  name: string;
  description: string | null;
  ip_address: string | null;
  port: number;
  slave_id: number;
  is_active: boolean;
  protocol: "s7" | "modbus";
  rack: number;
  slot: number;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

class SimpleModbusTCPClient implements ModbusTCPClient {
  constructor(public socket: net.Socket, public slaveId: number) {}

  async readCoils(address: number, quantity: number): Promise<any> {
    // Implement Modbus read coils logic here
    console.log(`Reading ${quantity} coils from address ${address}`);
    return { response: { body: { values: [Math.random() > 0.5] } } };
  }

  async readInputRegisters(address: number, quantity: number): Promise<any> {
    // Implement Modbus read input registers logic here
    console.log(`Reading ${quantity} input registers from address ${address}`);
    return { response: { body: { values: [Math.floor(Math.random() * 65536)] } } };
  }

  async readHoldingRegisters(address: number, quantity: number): Promise<any> {
    // Implement Modbus read holding registers logic here
    console.log(`Reading ${quantity} holding registers from address ${address}`);
    return { response: { body: { values: [Math.floor(Math.random() * 65536)] } } };
  }
}

export class PLCConnector {
  private devices: PLCDevice[];
  private clients: Map<string, ModbusTCPClient> = new Map();
  private s7Clients: Map<string, S7Communication> = new Map();

  constructor(devices: PLCDevice[]) {
    console.log('Initializing PLCConnector with devices:', devices);
    this.devices = devices.filter(device => 
      device.is_active && (device.protocol === 's7' || device.protocol === 'modbus')
    );
  }

  async connect(): Promise<void> {
    for (const device of this.devices) {
      try {
        if (!device.ip_address) {
          console.warn(`Device ${device.name} (${device.id}) has no IP address`);
          continue;
        }

        if (device.protocol === 'modbus') {
          console.log(`Attempting to connect to Modbus device ${device.name} at ${device.ip_address}:${device.port}`);
          const socket = new net.Socket();
          const client = new SimpleModbusTCPClient(socket, device.slave_id);

          await new Promise<void>((resolve, reject) => {
            socket.on('connect', () => {
              console.log(`Successfully connected to Modbus device ${device.name} (${device.id})`);
              this.clients.set(device.id, client);
              resolve();
            });

            socket.on('error', (err) => {
              console.error(`Error connecting to Modbus device ${device.name} (${device.id}):`, err);
              reject(err);
            });

            socket.connect(device.port, device.ip_address!);
          });
        } else if (device.protocol === 's7') {
          console.log(`Attempting to connect to S7 device ${device.name} at ${device.ip_address}`);
          const s7Client = new S7Communication();
          try {
            await s7Client.connect(device.ip_address, device.rack, device.slot);
            this.s7Clients.set(device.id, s7Client);
            console.log(`Successfully connected to S7 device ${device.name} (${device.id})`);
          } catch (error) {
            console.error(`Error connecting to S7 device ${device.name} (${device.id}):`, error);
          }
        }
      } catch (error) {
        console.error(`Error connecting to device ${device.name} (${device.id}):`, error);
      }
    }
  }

  async disconnect(): Promise<void> {
    // Disconnect Modbus clients
    for (const [deviceId, client] of this.clients) {
      await new Promise<void>((resolve) => {
        client.socket.end(() => {
          console.log(`Disconnected from Modbus device ${deviceId}`);
          resolve();
        });
      });
    }
    this.clients.clear();

    // Disconnect S7 clients
    for (const [deviceId, client] of this.s7Clients) {
      await client.disconnect(deviceId);
      console.log(`Disconnected from S7 device ${deviceId}`);
    }
    this.s7Clients.clear();
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
          const s7Client = this.s7Clients.get(block.deviceId);
          if (!s7Client) {
            console.error(`No S7 client found for device ${block.deviceId}`);
            continue;
          }

          const s7Data = await s7Client.readData(block.deviceId, [{
            area: block.area || 'DB',
            dbNumber: block.dbNumber || 1,
            start: block.address,
            amount: block.quantity,
            type: block.s7Type || 'INT'
          }]);

          result[`${block.deviceId}.${block.address}`] = s7Data[`var0`];
        } else {
          // Existing Modbus logic remains the same
          const client = this.clients.get(block.deviceId);
          if (!client) {
            console.error(`No Modbus client found for device ${block.deviceId}`);
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
            const values = response.response.body.valuesAsArray || response.response.body.values;
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

  getConnectionStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    for (const device of this.devices) {
      if (device.protocol === 'modbus') {
        status[device.id] = this.clients.has(device.id);
      } else if (device.protocol === 's7') {
        status[device.id] = this.s7Clients.has(device.id);
      } else {
        status[device.id] = false;
      }
    }
    return status;
  }
}
