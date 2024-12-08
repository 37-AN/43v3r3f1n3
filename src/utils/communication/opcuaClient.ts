import { toast } from "sonner";

// Simulated data types to match OPC UA structure
export interface DataValue {
  value: {
    value: number | boolean;
  };
}

export interface AttributeIds {
  Value: number;
}

export class CustomOPCUAClient {
  private connected: boolean = false;
  private simulatedValues: Map<string, number> = new Map();
  private subscriptionCallbacks: Map<string, ((value: DataValue) => void)[]> = new Map();

  constructor(
    private endpointUrl: string,
    private options = {
      applicationName: "Industrial IoT Client",
      connectionStrategy: {
        initialDelay: 1000,
        maxRetry: 3
      }
    }
  ) {
    console.log(`Creating simulated OPC UA Client for ${endpointUrl}`);
    // Initialize with some random values
    this.simulatedValues.set("temperature", Math.random() * 100);
    this.simulatedValues.set("pressure", Math.random() * 50);
    this.simulatedValues.set("speed", Math.random() * 1000);
    
    // Start simulation
    this.startSimulation();
  }

  private startSimulation() {
    setInterval(() => {
      if (this.connected) {
        // Update simulated values with some random fluctuation
        this.simulatedValues.forEach((value, key) => {
          const newValue = value + (Math.random() - 0.5) * 2;
          this.simulatedValues.set(key, newValue);
          
          // Notify subscribers
          const callbacks = this.subscriptionCallbacks.get(key) || [];
          callbacks.forEach(callback => {
            callback({
              value: { value: newValue }
            });
          });
        });
      }
    }, 1000);
  }

  async connect(): Promise<void> {
    try {
      console.log(`Connecting to simulated OPC UA server at ${this.endpointUrl}`);
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 500));
      this.connected = true;
      console.log('Successfully connected to simulated OPC UA server');
    } catch (error) {
      console.error('Failed to connect to simulated OPC UA server:', error);
      throw error;
    }
  }

  async readValue(nodeId: string): Promise<number | boolean | null> {
    try {
      const value = this.simulatedValues.get(nodeId);
      return value ?? null;
    } catch (error) {
      console.error(`Error reading node ${nodeId}:`, error);
      return null;
    }
  }

  async writeValue(nodeId: string, value: number | boolean): Promise<void> {
    try {
      this.simulatedValues.set(nodeId, value as number);
      toast.success(`Value written successfully to ${nodeId}`);
    } catch (error) {
      console.error(`Error writing to node ${nodeId}:`, error);
      toast.error(`Failed to write value to ${nodeId}`);
      throw error;
    }
  }

  async subscribe(nodeId: string, callback: (dataValue: DataValue) => void): Promise<void> {
    try {
      const callbacks = this.subscriptionCallbacks.get(nodeId) || [];
      callbacks.push(callback);
      this.subscriptionCallbacks.set(nodeId, callbacks);
    } catch (error) {
      console.error(`Error subscribing to node ${nodeId}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.subscriptionCallbacks.clear();
    console.log('Disconnected from simulated OPC UA server');
  }

  isConnected(): boolean {
    return this.connected;
  }
}