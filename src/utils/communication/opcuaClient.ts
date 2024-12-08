import {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  ClientSubscription,
  ClientMonitoredItem,
  DataValue
} from "node-opcua";

export interface OPCUAClientOptions {
  applicationName: string;
  connectionStrategy: {
    initialDelay: number;
    maxRetry: number;
  };
}

export class CustomOPCUAClient {
  private client: OPCUAClient;
  private session: any;
  private subscription: ClientSubscription | null = null;
  private connected: boolean = false;
  private monitoredItems: Map<string, ClientMonitoredItem> = new Map();

  constructor(
    private endpointUrl: string,
    private options: OPCUAClientOptions
  ) {
    console.log(`Creating OPC UA Client for ${endpointUrl}`);
    
    this.client = OPCUAClient.create({
      applicationName: options.applicationName,
      connectionStrategy: options.connectionStrategy,
      securityMode: MessageSecurityMode.None,
      securityPolicy: SecurityPolicy.None,
    });
  }

  async connect(): Promise<void> {
    try {
      console.log(`Connecting to OPC UA server at ${this.endpointUrl}`);
      await this.client.connect(this.endpointUrl);
      
      console.log("Creating session...");
      this.session = await this.client.createSession();
      
      console.log("Creating subscription...");
      this.subscription = ClientSubscription.create(this.session, {
        requestedPublishingInterval: 1000,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 100,
        publishingEnabled: true,
        priority: 10
      });

      this.connected = true;
      console.log("Successfully connected to OPC UA server");
    } catch (error) {
      console.error("Failed to connect to OPC UA server:", error);
      throw error;
    }
  }

  async subscribe(nodeId: string, callback: (dataValue: DataValue) => void): Promise<void> {
    if (!this.subscription) {
      throw new Error("No active subscription");
    }

    try {
      console.log(`Subscribing to node ${nodeId}`);
      
      const itemToMonitor = {
        nodeId: nodeId,
        attributeId: AttributeIds.Value
      };

      const parameters = {
        samplingInterval: 100,
        discardOldest: true,
        queueSize: 10
      };

      const monitoredItem = ClientMonitoredItem.create(
        this.subscription,
        itemToMonitor,
        parameters,
        TimestampToDate
      );

      monitoredItem.on("changed", (dataValue: DataValue) => {
        console.log(`Received data for ${nodeId}:`, dataValue);
        callback(dataValue);
      });

      this.monitoredItems.set(nodeId, monitoredItem);
      console.log(`Successfully subscribed to node ${nodeId}`);
    } catch (error) {
      console.error(`Error subscribing to node ${nodeId}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.subscription) {
        console.log("Terminating subscription...");
        await this.subscription.terminate();
      }
      
      if (this.session) {
        console.log("Closing session...");
        await this.session.close();
      }
      
      console.log("Disconnecting client...");
      await this.client.disconnect();
      
      this.connected = false;
      this.monitoredItems.clear();
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

function TimestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}