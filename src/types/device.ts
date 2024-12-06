export type DeviceMetric = {
  label: string;
  value: string | number;
  unit?: string;
};

export type Device = {
  id: string;
  name: string;
  status: "active" | "warning" | "error";
  metrics: DeviceMetric[];
};

export const initialDevices: Device[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "PLC Controller A1",
    status: "active",
    metrics: [
      { label: "CPU Load", value: 45, unit: "%" },
      { label: "Memory Usage", value: 2.8, unit: "GB" },
      { label: "Network I/O", value: "1.2", unit: "MB/s" },
      { label: "Token Value", value: "1.5", unit: "ETH" },
    ],
  },
  {
    id: "223e4567-e89b-12d3-a456-426614174001",
    name: "OPC UA Server B2",
    status: "warning",
    metrics: [
      { label: "Active Tags", value: 1250 },
      { label: "Update Rate", value: 100, unit: "ms" },
      { label: "Queue Size", value: 85, unit: "%" },
    ],
  },
  {
    id: "323e4567-e89b-12d3-a456-426614174002",
    name: "MQTT Broker C3",
    status: "active",
    metrics: [
      { label: "Connected Clients", value: 48 },
      { label: "Message Rate", value: 2.4, unit: "k/s" },
      { label: "Bandwidth", value: 5.6, unit: "MB/s" },
    ],
  },
];