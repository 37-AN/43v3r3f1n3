import { toast } from "sonner";

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
  private updateInterval: NodeJS.Timeout | null = null;

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
    console.log(`Creating OPC UA Client for ${endpointUrl}`);
    this.initializeSimulatedValues();
  }

  private initializeSimulatedValues() {
    // Initialize with realistic starting values
    this.simulatedValues.set("Temperature", 25 + Math.random() * 5); // Around room temperature
    this.simulatedValues.set("Pressure", 1000 + Math.random() * 50); // Around atmospheric pressure
    this.simulatedValues.set("Speed", 1500 + Math.random() * 100); // RPM for a motor
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
        this.simulatedValues.forEach((value, key) => {
          // Add some random variation to the values
          let newValue = value;
          switch (key) {
            case "Temperature":
              newValue += (Math.random() - 0.5) * 0.5; // Small temperature changes
              break;
            case "Pressure":
              newValue += (Math.random() - 0.5) * 10; // Larger pressure variations
              break;
            case "Speed":
              newValue += (Math.random() - 0.5) * 50; // Speed variations
              break;
          }
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

  async subscribe(nodeId: string, callback: (dataValue: DataValue) => void): Promise<void> {
    try {
      console.log(`Subscribing to node ${nodeId}`);
      const callbacks = this.subscriptionCallbacks.get(nodeId) || [];
      callbacks.push(callback);
      this.subscriptionCallbacks.set(nodeId, callbacks);
      
      // Immediately send initial value
      const initialValue = this.simulatedValues.get(nodeId.split(';').pop() || '') || 0;
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