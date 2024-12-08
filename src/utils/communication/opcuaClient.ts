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
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor(endpointUrl: string, options: OPCUAClientOptions) {
    console.log(`Creating OPC UA Client for ${endpointUrl}`);
    this.endpointUrl = endpointUrl;
    this.options = options;
  }

  async connect(): Promise<void> {
    try {
      console.log(`Connecting to OPC UA server at ${this.endpointUrl}`);
      
      // Start connection monitoring
      this.startConnectionMonitoring();
      
      // Simulate initial connection attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.connected = true;
      console.log("Successfully connected to OPC UA server");
    } catch (error) {
      console.error("Failed to connect to OPC UA server:", error);
      this.connected = false;
      throw error;
    }
  }

  private startConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    this.connectionCheckInterval = setInterval(() => {
      // Simulate connection check - in a real implementation, 
      // this would use proper OPC UA connection status checks
      const isServerRunning = Math.random() > 0.1; // 90% chance of being connected
      
      const wasConnected = this.connected;
      this.connected = isServerRunning;

      if (wasConnected && !this.connected) {
        console.log(`Lost connection to ${this.endpointUrl}`);
        this.clearMonitoredItems();
      } else if (!wasConnected && this.connected) {
        console.log(`Reconnected to ${this.endpointUrl}`);
      }
    }, 5000); // Check every 5 seconds
  }

  private clearMonitoredItems() {
    console.log('Clearing all monitored items due to connection loss');
    for (const interval of this.monitoredItems.values()) {
      clearInterval(interval);
    }
    this.monitoredItems.clear();
  }

  async subscribe(nodeId: string, callback: (dataValue: DataValue) => void): Promise<void> {
    try {
      console.log(`Subscribing to node ${nodeId}`);
      
      if (!this.connected) {
        console.warn(`Cannot subscribe to ${nodeId} - not connected`);
        return;
      }

      // Clear any existing subscription for this node
      if (this.monitoredItems.has(nodeId)) {
        clearInterval(this.monitoredItems.get(nodeId));
      }
      
      // Simulate different data patterns based on node type
      const interval = setInterval(() => {
        if (!this.connected) {
          console.log(`Stopping data simulation for ${nodeId} - connection lost`);
          clearInterval(interval);
          this.monitoredItems.delete(nodeId);
          return;
        }

        let value: number;
        
        if (nodeId.includes('Counter')) {
          value = Math.floor(Date.now() / 1000) % 100;
        } else if (nodeId.includes('Random')) {
          value = Math.random() * 100;
        } else if (nodeId.includes('Sinusoid')) {
          value = Math.sin(Date.now() / 1000) * 50 + 50;
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
      
      // Clear connection monitoring
      if (this.connectionCheckInterval) {
        clearInterval(this.connectionCheckInterval);
        this.connectionCheckInterval = null;
      }
      
      // Clear all subscriptions
      this.clearMonitoredItems();
      
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