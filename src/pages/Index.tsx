import { DeviceCard } from "@/components/DeviceCard";
import { MetricsChart } from "@/components/MetricsChart";

// Sample data - in a real app, this would come from your backend
const devices = [
  {
    name: "Temperature Sensor A1",
    status: "active" as const,
    metrics: [
      { label: "Temperature", value: 23.5, unit: "°C" },
      { label: "Humidity", value: 45, unit: "%" },
      { label: "Uptime", value: "24h" },
    ],
  },
  {
    name: "Pressure Sensor B2",
    status: "warning" as const,
    metrics: [
      { label: "Pressure", value: 1013, unit: "hPa" },
      { label: "Battery", value: 15, unit: "%" },
      { label: "Uptime", value: "12h" },
    ],
  },
  {
    name: "Flow Meter C3",
    status: "error" as const,
    metrics: [
      { label: "Flow Rate", value: 0, unit: "L/min" },
      { label: "Total Flow", value: 1250, unit: "L" },
      { label: "Status", value: "Offline" },
    ],
  },
];

const chartData = Array.from({ length: 24 }, (_, i) => ({
  timestamp: `${i}:00`,
  value: Math.random() * 100 + 50,
}));

export default function Index() {
  return (
    <div className="min-h-screen bg-system-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="animate-fade-up">
          <h1 className="text-3xl font-semibold text-system-gray-900">Industrial Data Refinement</h1>
          <p className="text-system-gray-500 mt-2">Real-time monitoring and control</p>
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
            data={chartData}
            className="transition-transform hover:scale-[1.01]"
          />
          <MetricsChart
            title="Resource Usage"
            data={chartData.map(d => ({ ...d, value: Math.random() * 80 + 20 }))}
            className="transition-transform hover:scale-[1.01]"
          />
        </div>
      </div>
    </div>
  );
}