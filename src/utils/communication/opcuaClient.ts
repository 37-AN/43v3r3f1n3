export interface OPCUAClientOptions {
  applicationName: string;
  connectionStrategy: {
    initialDelay: number;
    maxRetry: number;
  };
}

export interface DataValue {
  value: {
    value: number;
  };
}

export class CustomOPCUAClient {
  private endpointUrl: string;
  private options: OPCUAClientOptions;
  private connected: boolean = false;
  private monitoredItems: Map<string, NodeJS.Timeout> = new Map();

  constructor(endpointUrl: string, options: OPCUAClientOptions) {
    console.log(`Creating OPC UA Client for ${endpointUrl}`);
    this.endpointUrl = endpointUrl;
    this.options = options;
  }

  async connect(): Promise<void> {
    try {
      console.log(`Connecting to OPC UA server at ${this.endpointUrl}`);
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.connected = true;
      console.log("Successfully connected to OPC UA server");
    } catch (error) {
      console.error("Failed to connect to OPC UA server:", error);
      throw error;
    }
  }

  async subscribe(nodeId: string, callback: (dataValue: DataValue) => void): Promise<void> {
    try {
      console.log(`Subscribing to node ${nodeId}`);
      
      // Simulate different data patterns based on node type
      const interval = setInterval(() => {
        let value: number;
        
        if (nodeId.includes('Counter')) {
          value = Math.floor(Date.now() / 1000) % 100; // 0-99 counter
        } else if (nodeId.includes('Random')) {
          value = Math.random() * 100; // 0-100 random value
        } else if (nodeId.includes('Sinusoid')) {
          value = Math.sin(Date.now() / 1000) * 50 + 50; // 0-100 sine wave
        } else {
          value = 0;
        }

        const dataValue: DataValue = {
          value: { value }
        };
        
        console.log(`Received data for ${nodeId}:`, dataValue);
        callback(dataValue);
      }, 1000);

      this.monitoredItems.set(nodeId, interval);
      console.log(`Successfully subscribed to node ${nodeId}`);
    } catch (error) {
      console.error(`Error subscribing to node ${nodeId}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      console.log("Disconnecting client...");
      
      // Clear all intervals
      for (const interval of this.monitoredItems.values()) {
        clearInterval(interval);
      }
      this.monitoredItems.clear();
      
      this.connected = false;
      console.log("Disconnected from OPC UA server");
    } catch (error) {
      console.error("Error during disconnect:", error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}