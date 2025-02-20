
import { ConnectionStatusBanner } from "@/components/ConnectionStatusBanner";
import { useOPCUAClients } from "@/hooks/useOPCUAClients";
import { usePLCData } from "@/hooks/usePLCData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnotationDashboard } from "@/components/annotation/AnnotationDashboard";
import { SimulationTab } from "@/features/simulation/components/SimulationTab";
import { QualityTab } from "@/features/quality/components/QualityTab";

export default function Index() {
  const { simulatedData } = useOPCUAClients();
  const { plcData } = usePLCData(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const handleRetryLoad = () => {
    console.log("Retrying device load...");
    setRetryCount(0);
    fetchFirstDevice();
  };

  const fetchFirstDevice = async () => {
    try {
      setIsLoading(true);
      console.log("Attempting to fetch first PLC device");

      const { data: devices, error } = await supabase
        .from('plc_devices')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching PLC device:", error);
        if (retryCount < MAX_RETRIES) {
          console.log(`Retry attempt ${retryCount + 1} of ${MAX_RETRIES}`);
          setRetryCount(prev => prev + 1);
          setTimeout(fetchFirstDevice, Math.pow(2, retryCount) * 1000);
        } else {
          toast.error("Failed to load device data. Please try again.");
        }
        return;
      }

      if (devices) {
        console.log("Found device:", devices);
        setSelectedDeviceId(devices.id);
        setRetryCount(0);
      } else {
        console.log("No devices found");
        toast.info("No devices found. Please add a device first.");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedDeviceId && !isLoading) {
      fetchFirstDevice();
    }
  }, [selectedDeviceId]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <ConnectionStatusBanner />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Industrial Data Platform</h1>
        <p className="text-gray-600">Manage your industrial data processing and annotation tasks</p>
      </div>

      <Tabs defaultValue="simulation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="simulation" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Simulation
          </TabsTrigger>
          <TabsTrigger value="annotation" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Annotation
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Quality
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulation">
          <SimulationTab
            isLoading={isLoading}
            selectedDeviceId={selectedDeviceId}
            simulatedData={simulatedData}
            onRetryLoad={handleRetryLoad}
          />
        </TabsContent>

        <TabsContent value="annotation">
          <AnnotationDashboard />
        </TabsContent>

        <TabsContent value="quality">
          <QualityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
