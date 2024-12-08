import { toast } from "sonner";

export interface DataValue {
  value: {
    value: number | boolean;
  };
}

export interface AttributeIds {
  Value: number;
}

interface OPCUAClientOptions {
  applicationName: string;
  serverUri?: string;
  connectionStrategy: {
    initialDelay: number;
    maxRetry: number;
  };
}

export class CustomOPCUAClient {
  private connected: boolean = false;
  private simulatedValues: Map<string, number> = new Map();
  private subscriptionCallbacks: Map<string, ((value: DataValue) => void)[]> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(
    private endpointUrl: string,
    private options: OPCUAClientOptions = {
      applicationName: "Industrial IoT Client",
      connectionStrategy: {
        initialDelay: 1000,
        maxRetry: 3
      }
    }
  ) {
    console.log(`Creating OPC UA Client for ${endpointUrl} with options:`, options);
    this.initializeSimulatedValues();
  }

  private initializeSimulatedValues() {
    // Initialize with realistic starting values for common OPC UA variables
    this.simulatedValues.set("Counter1", 0);
    this.simulatedValues.set("Random1", Math.random() * 100);
    this.simulatedValues.set("Sinusoid1", Math.sin(Date.now() / 1000) * 100);
  }

  async connect(): Promise<void> {
    try {
      console.log(`Connecting to OPC UA server at ${this.endpointUrl}`);
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 500));
      this.connected = true;
      this.startSimulation();
      console.log('Successfully connected to OPC UA server');
    } catch (error) {
      console.error('Failed to connect to OPC UA server:', error);
      throw error;
    }
  }

  private startSimulation() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      if (this.connected) {
        // Update simulated values
        const time = Date.now() / 1000;
        this.simulatedValues.set("Counter1", (this.simulatedValues.get("Counter1") || 0) + 1);
        this.simulatedValues.set("Random1", Math.random() * 100);
        this.simulatedValues.set("Sinusoid1", Math.sin(time) * 100);
        
        // Notify subscribers
        this.simulatedValues.forEach((value, key) => {
          const callbacks = this.subscriptionCallbacks.get(key) || [];
          callbacks.forEach(callback => {
            callback({
              value: { value }
            });
          });
        });
      }
    }, 1000);
  }

  async subscribe(nodeId: string, callback: (dataValue: DataValue) => void): Promise<void> {
    try {
      console.log(`Subscribing to node ${nodeId}`);
      const variableName = nodeId.split(';').pop()?.split('=').pop() || '';
      const callbacks = this.subscriptionCallbacks.get(variableName) || [];
      callbacks.push(callback);
      this.subscriptionCallbacks.set(variableName, callbacks);
      
      // Immediately send initial value
      const initialValue = this.simulatedValues.get(variableName) || 0;
      callback({ value: { value: initialValue } });
    } catch (error) {
      console.error(`Error subscribing to node ${nodeId}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.subscriptionCallbacks.clear();
    console.log('Disconnected from OPC UA server');
  }

  isConnected(): boolean {
    return this.connected;
  }
}