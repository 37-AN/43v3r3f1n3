import { DeviceCard } from "@/components/DeviceCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const initialDevices = [
  {
    name: "PLC Controller A1",
    status: "active" as const,
    metrics: [
      { label: "CPU Load", value: 45, unit: "%" },
      { label: "Memory Usage", value: 2.8, unit: "GB" },
      { label: "Network I/O", value: "1.2", unit: "MB/s" },
      { label: "Token Value", value: "1.5", unit: "ETH" },
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

export const DeviceGrid = () => {
  const [devices, setDevices] = useState(initialDevices);

  useEffect(() => {
    // Subscribe to real-time device updates
    const deviceUpdates = supabase
      .channel('device-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tokenized_assets',
        },
        (payload) => {
          console.log('Received device update:', payload);
          // Update devices state based on the payload
          // This is a placeholder - implement actual update logic based on your needs
        }
      )
      .subscribe();

    return () => {
      deviceUpdates.unsubscribe();
    };
  }, []);

  return (
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
  );
};