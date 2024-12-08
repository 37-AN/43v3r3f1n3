import type { ModbusTCPClient } from '@/types/modbus';

export class ModbusClient implements ModbusTCPClient {
  private socket: WebSocket | null = null;
  private connected: boolean = false;

  constructor(
    private ip: string,
    private port: number,
    private slaveId: number
  ) {
    console.log(`Creating ModbusClient for ${ip}:${port}`);
  }

  async connect(): Promise<void> {
    try {
      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plc-proxy`;
      const wsUrl = `wss://${new URL(proxyUrl).host}/functions/v1/plc-proxy?host=${this.ip}&port=${this.port}&protocol=modbus`;
      
      this.socket = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error('Failed to create WebSocket'));

        this.socket.onopen = () => {
          console.log(`Connected to Modbus device at ${this.ip}:${this.port}`);
          this.connected = true;
          resolve();
        };
        
        this.socket.onerror = (error) => {
          console.error(`Failed to connect to Modbus device:`, error);
          reject(error);
        };
      });
    } catch (error) {
      console.error(`Failed to connect to Modbus device:`, error);
      throw error;
    }
  }

  async readCoils(address: number, quantity: number): Promise<any> {
    console.log(`Reading ${quantity} coils from address ${address}`);
    return { response: { body: { values: [Math.random() > 0.5] } } };
  }

  async readInputRegisters(address: number, quantity: number): Promise<any> {
    console.log(`Reading ${quantity} input registers from address ${address}`);
    return { response: { body: { values: [Math.floor(Math.random() * 65536)] } } };
  }

  async readHoldingRegisters(address: number, quantity: number): Promise<any> {
    console.log(`Reading ${quantity} holding registers from address ${address}`);
    return { response: { body: { values: [Math.floor(Math.random() * 65536)] } } };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}