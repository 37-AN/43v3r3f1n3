import { Header } from "@/components/Header";
import { PLCDeviceGrid } from "@/components/PLCDeviceGrid";
import { DeviceConfigManager } from "@/components/DeviceConfigManager";
import { ArduinoPLCDataGrid } from "@/components/ArduinoPLCDataGrid";
import { useUserEmail } from "@/hooks/useUserEmail";
import { useState } from "react";

const Index = () => {
  const userEmail = useUserEmail();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTokenize = () => {
    // Implement tokenization logic here
    console.log("Tokenize clicked");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Header 
        userEmail={userEmail}
        isProcessing={isProcessing}
        onTokenizeClick={handleTokenize}
      />
      <DeviceConfigManager />
      <PLCDeviceGrid />
      <ArduinoPLCDataGrid />
    </div>
  );
};

export default Index;