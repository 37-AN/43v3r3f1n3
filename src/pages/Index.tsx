import { DeviceCard } from "@/components/DeviceCard";
import { MetricsChart } from "@/components/MetricsChart";

// Sample data - in a real app, this would come from your backend
const devices = [
  {
    name: "PLC Controller A1",
    status: "active" as const,
    metrics: [
      { label: "CPU Load", value: 45, unit: "%" },
      { label: "Memory Usage", value: 2.8, unit: "GB" },
      { label: "Network I/O", value: "1.2", unit: "MB/s" },
    ],
  },
  {
    name: "OPC UA Server B2",
    status: "warning" as const,
    metrics: [
      { label: "Active Tags", value: 1250 },
      { label: "Update Rate", value: 100, unit: "ms" },
      { label: "Queue Size", value: 85, unit: "%" },
    ],
  },
  {
    name: "MQTT Broker C3",
    status: "active" as const,
    metrics: [
      { label: "Connected Clients", value: 48 },
      { label: "Message Rate", value: 2.4, unit: "k/s" },
      { label: "Bandwidth", value: 5.6, unit: "MB/s" },
    ],
  },
];

const performanceData = Array.from({ length: 24 }, (_, i) => ({
  timestamp: `${i}:00`,
  value: Math.floor(Math.random() * 30) + 60, // Random values between 60-90
}));

const resourceData = Array.from({ length: 24 }, (_, i) => ({
  timestamp: `${i}:00`,
  value: Math.floor(Math.random() * 40) + 30, // Random values between 30-70
}));

export default function Index() {
  return (
    <div className="min-h-screen bg-system-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="animate-fade-up">
          <h1 className="text-3xl font-semibold text-system-gray-900">Industrial Data Refinement</h1>
          <p className="text-system-gray-500 mt-2">Real-time monitoring and data collection system</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device, index) => (
            <DeviceCard
              key={index}
              name={device.name}
              status={device.status}
              metrics={device.metrics}
              className="transition-transform hover:scale-[1.02]"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricsChart
            title="System Performance"
            data={performanceData}
            className="transition-transform hover:scale-[1.01]"
          />
          <MetricsChart
            title="Resource Utilization"
            data={resourceData}
            className="transition-transform hover:scale-[1.01]"
          />
        </div>
      </div>
    </div>
  );
}