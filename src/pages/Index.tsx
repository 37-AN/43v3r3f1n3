import { Header } from "@/components/Header";
import { PLCDeviceGrid } from "@/components/PLCDeviceGrid";
import { DeviceConfigManager } from "@/components/DeviceConfigManager";

const Index = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Header />
      <DeviceConfigManager />
      <PLCDeviceGrid />
    </div>
  );
};

export default Index;