import { toast } from "sonner";

export interface DataValue {
  value: {
    value: number | boolean;
  };
}

export interface AttributeIds {
  Value: number;
}

export interface OPCUAClientOptions {
  applicationName: string;
  serverUri?: string;
  connectionStrategy: {
    initialDelay: number;
    maxRetry: number;
  };
}

export class CustomOPCUAClient {
  private connected: boolean = false;
  private subscriptionCallbacks: Map<string, ((value: DataValue) => void)[]> = new Map();
  private simulationInterval: NodeJS.Timeout | null = null;

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
  }

  async connect(): Promise<void> {
    try {
      console.log(`Connecting to OPC UA server at ${this.endpointUrl}`);
      // Simulate successful connection
      await new Promise(resolve => setTimeout(resolve, 500));
      this.connected = true;
      console.log('Successfully connected to OPC UA server');
      
      // Start simulation data
      this.startSimulation();
      
      toast.success(`Connected to OPC UA server at ${this.endpointUrl}`);
    } catch (error) {
      console.error('Failed to connect to OPC UA server:', error);
      toast.error(`Failed to connect to OPC UA server: ${error}`);
      throw error;
    }
  }

  private startSimulation() {
    console.log('Starting simulation data generation');
    this.simulationInterval = setInterval(() => {
      this.subscriptionCallbacks.forEach((callbacks, nodeId) => {
        const simulatedValue = this.generateSimulatedValue(nodeId);
        callbacks.forEach(callback => {
          callback({
            value: {
              value: simulatedValue
            }
          });
        });
      });
    }, 1000);
  }

  private generateSimulatedValue(nodeId: string): number {
    if (nodeId.includes('Counter')) {
      return Math.floor(Date.now() / 1000) % 100;
    } else if (nodeId.includes('Random')) {
      return Math.random() * 100;
    } else if (nodeId.includes('Sinusoid')) {
      return Math.sin(Date.now() / 1000) * 50 + 50;
    }
    return 0;
  }

  async subscribe(nodeId: string, callback: (dataValue: DataValue) => void): Promise<void> {
    try {
      console.log(`Subscribing to node ${nodeId}`);
      const callbacks = this.subscriptionCallbacks.get(nodeId) || [];
      callbacks.push(callback);
      this.subscriptionCallbacks.set(nodeId, callbacks);
      
      // Immediately send initial value
      const initialValue = this.generateSimulatedValue(nodeId);
      callback({
        value: {
          value: initialValue
        }
      });
      
      console.log(`Subscribed to node ${nodeId}`);
    } catch (error) {
      console.error(`Error subscribing to node ${nodeId}:`, error);
      toast.error(`Failed to subscribe to node ${nodeId}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.connected = false;
    this.subscriptionCallbacks.clear();
    console.log('Disconnected from OPC UA server');
    toast.info('Disconnected from OPC UA server');
  }

  isConnected(): boolean {
    return this.connected;
  }
}