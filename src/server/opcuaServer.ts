import { OPCUAServer, DataType, Variant } from "node-opcua";

async function startOPCUAServer() {
  const server = new OPCUAServer({
    port: 4334,
    resourcePath: "/UA/SimpleServer",
    buildInfo: {
      productName: "SimpleOPCUAServer",
      buildNumber: "1",
      buildDate: new Date(),
    },
  });

  await server.initialize();
  console.log("OPCUA Server initialized");

  const addressSpace = server.engine.addressSpace;
  if (!addressSpace) return;

  const namespace = addressSpace.getOwnNamespace();

  // Create a device object
  const device = namespace.addObject({
    organizedBy: addressSpace.rootFolder.objects,
    browseName: "Device",
  });

  // Add variables
  let counter = 0;
  namespace.addVariable({
    componentOf: device,
    browseName: "Counter",
    nodeId: "ns=1;s=Counter",
    dataType: "Double",
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: counter++ }),
    },
  });

  let temperature = 25.0;
  namespace.addVariable({
    componentOf: device,
    browseName: "Temperature",
    nodeId: "ns=1;s=Temperature",
    dataType: "Double",
    value: {
      get: () => {
        temperature += (Math.random() - 0.5);
        return new Variant({ dataType: DataType.Double, value: temperature });
      },
    },
  });

  await server.start();
  console.log("OPCUA Server started at port", server.endpoints[0].port);
  console.log("Server endpoint URL:", server.endpoints[0].endpointDescriptions()[0].endpointUrl);
}

startOPCUAServer().catch(console.error);