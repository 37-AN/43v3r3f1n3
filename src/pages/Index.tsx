import { DeviceCard } from "@/components/DeviceCard";
import { MetricsChart } from "@/components/MetricsChart";
import { useEffect, useState } from "react";
import { initializeAIModels, refineData, type TimeSeriesDataPoint } from "@/utils/dataRefinement";
import { toast } from "sonner";

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

// Generate sample data with some anomalies and noise
const generateSampleData = (length: number, baseValue: number, variance: number): TimeSeriesDataPoint[] => {
  return Array.from({ length }, (_, i) => ({
    timestamp: `${i}:00`,
    value: baseValue + Math.sin(i / 4) * variance + (Math.random() - 0.5) * variance,
  }));
};

const performanceData = generateSampleData(24, 75, 15);
const resourceData = generateSampleData(24, 50, 20);

export default function Index() {
  const [refinedPerformance, setRefinedPerformance] = useState(performanceData);
  const [refinedResources, setRefinedResources] = useState(resourceData);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processData = async () => {
      try {
        console.log("Initializing AI models and processing data");
        await initializeAIModels();
        
        const [performanceResults, resourceResults] = await Promise.all([
          refineData(performanceData),
          refineData(resourceData),
        ]);

        setRefinedPerformance(performanceResults.refinedData);
        setRefinedResources(resourceResults.refinedData);

        if (performanceResults.anomalies.length > 0 || resourceResults.anomalies.length > 0) {
          toast.warning(`Detected ${performanceResults.anomalies.length + resourceResults.anomalies.length} anomalies`);
        }

        console.log("Data processing completed successfully");
      } catch (error) {
        console.error("Error processing data:", error);
        toast.error("Error processing data");
      } finally {
        setIsProcessing(false);
      }
    };

    processData();
  }, []);

  return (
    <div className="min-h-screen bg-system-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="animate-fade-up">
          <h1 className="text-3xl font-semibold text-system-gray-900">Industrial Data Refinement</h1>
          <p className="text-system-gray-500 mt-2">Real-time monitoring and data collection system</p>
          {isProcessing && (
            <p className="text-sm text-system-gray-400 mt-1">Processing data with AI models...</p>
          )}
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
            data={refinedPerformance}
            className="transition-transform hover:scale-[1.01]"
          />
          <MetricsChart
            title="Resource Utilization"
            data={refinedResources}
            className="transition-transform hover:scale-[1.01]"
          />
        </div>
      </div>
    </div>
  );
}
