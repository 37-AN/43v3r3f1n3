import { OPCUAClient, AttributeIds, DataValue } from "node-opcua-client";
import { toast } from "sonner";

export class OPCUAClient {
  private client: any;
  private session: any;
  private subscription: any;
  private connected: boolean = false;

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
    this.client = OPCUAClient.create(this.options);
  }

  async connect(): Promise<void> {
    try {
      console.log(`Connecting to OPC UA server at ${this.endpointUrl}`);
      await this.client.connect(this.endpointUrl);
      this.session = await this.client.createSession();
      this.connected = true;
      console.log('Successfully connected to OPC UA server');
    } catch (error) {
      console.error('Failed to connect to OPC UA server:', error);
      throw error;
    }
  }

  async readValue(nodeId: string): Promise<number | boolean | null> {
    try {
      const dataValue = await this.session.read({
        nodeId,
        attributeId: AttributeIds.Value
      });
      return dataValue.value.value;
    } catch (error) {
      console.error(`Error reading node ${nodeId}:`, error);
      return null;
    }
  }

  async writeValue(nodeId: string, value: number | boolean): Promise<void> {
    try {
      await this.session.write({
        nodeId,
        attributeId: AttributeIds.Value,
        value: {
          value: {
            dataType: typeof value === 'boolean' ? 'Boolean' : 'Double',
            value: value
          }
        }
      });
      toast.success(`Value written successfully to ${nodeId}`);
    } catch (error) {
      console.error(`Error writing to node ${nodeId}:`, error);
      toast.error(`Failed to write value to ${nodeId}`);
      throw error;
    }
  }

  async subscribe(nodeId: string, callback: (dataValue: DataValue) => void): Promise<void> {
    try {
      if (!this.subscription) {
        this.subscription = await this.session.createSubscription2({
          requestedPublishingInterval: 1000,
          requestedLifetimeCount: 100,
          requestedMaxKeepAliveCount: 10,
          maxNotificationsPerPublish: 100,
          publishingEnabled: true,
          priority: 10
        });
      }

      await this.subscription.monitor({
        nodeId,
        attributeId: AttributeIds.Value
      }, 
      {
        samplingInterval: 1000,
        discardOldest: true,
        queueSize: 10
      }, 
      callback);

    } catch (error) {
      console.error(`Error subscribing to node ${nodeId}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.subscription) {
      await this.subscription.terminate();
    }
    if (this.session) {
      await this.session.close();
    }
    await this.client.disconnect();
    this.connected = false;
    console.log('Disconnected from OPC UA server');
  }

  isConnected(): boolean {
    return this.connected;
  }
}