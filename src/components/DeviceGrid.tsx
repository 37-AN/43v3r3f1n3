import { DeviceCard } from "@/components/DeviceCard";
import { useDeviceUpdates } from "@/hooks/useDeviceUpdates";

export const DeviceGrid = () => {
  const devices = useDeviceUpdates();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map((device) => (
        <DeviceCard
          key={device.id}
          deviceId={device.id}
          name={device.name}
          status={device.status}
          metrics={device.metrics}
          className="transition-transform hover:scale-[1.02]"
        />
      ))}
    </div>
  );
};