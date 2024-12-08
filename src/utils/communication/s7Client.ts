export class S7Client {
  private socket: WebSocket | null = null;
  private connected: boolean = false;

  constructor(
    private ip: string,
    private rack: number,
    private slot: number
  ) {
    console.log(`Creating S7Client for ${ip} (rack: ${rack}, slot: ${slot})`);
  }

  async connect(): Promise<void> {
    try {
      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plc-proxy`;
      const wsUrl = `wss://${new URL(proxyUrl).host}/functions/v1/plc-proxy?host=${this.ip}&port=102&protocol=s7`;
      
      this.socket = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error('Failed to create WebSocket'));

        this.socket.onopen = () => {
          console.log(`Connected to S7 device at ${this.ip}`);
          this.connected = true;
          resolve();
        };
        
        this.socket.onerror = (error) => {
          console.error(`Failed to connect to S7 device:`, error);
          reject(error);
        };
      });
    } catch (error) {
      console.error(`Failed to connect to S7 device:`, error);
      throw error;
    }
  }

  async readData(variables: { area: string, dbNumber: number, start: number, amount: number, type: string }[]): Promise<any> {
    console.log(`Reading S7 data:`, variables);
    // Simulate reading data
    return variables.reduce((acc, v) => {
      acc[`var${v.start}`] = Math.floor(Math.random() * 100);
      return acc;
    }, {});
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