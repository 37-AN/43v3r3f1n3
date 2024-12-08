import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { lmStudio } from "@/utils/lmstudio";

export function LMStudioStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkConnection = async () => {
      setIsChecking(true);
      try {
        const connected = await lmStudio.testConnection();
        console.log('LM Studio connection status:', connected);
        setIsConnected(connected);
      } catch (error) {
        console.error('Error checking LM Studio connection:', error);
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">LM Studio Status</h3>
          <p className="text-sm text-gray-500">Local AI Model Server</p>
        </div>
        <Badge 
          variant={isConnected ? "success" : "destructive"}
          className="capitalize"
        >
          {isChecking ? 'Checking...' : (isConnected ? 'Connected' : 'Disconnected')}
        </Badge>
      </div>
    </Card>
  );
}