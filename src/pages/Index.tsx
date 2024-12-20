import { ConnectionStatusBanner } from "@/components/ConnectionStatusBanner";
import { SimulationDashboard } from "@/features/simulation/components/SimulationDashboard";
import { useOPCUAClients } from "@/hooks/useOPCUAClients";
import { usePLCData } from "@/hooks/usePLCData";
import { useSession } from "@/hooks/useSession";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList, Database, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnotationDashboard } from "@/components/annotation/AnnotationDashboard";

export default function Index() {
  const { session, loading: sessionLoading } = useSession();
  const { simulatedData } = useOPCUAClients();
  const { plcData } = usePLCData(!!session);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const fetchFirstDevice = async () => {
    try {
      setIsLoading(true);
      console.log("Attempting to fetch first PLC device");

      if (!session?.user?.id) {
        console.log("No authenticated user");
        return;
      }

      const { data: devices, error } = await supabase
        .from('plc_devices')
        .select('id, owner_id')
        .eq('owner_id', session.user.id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching PLC device:", error);
        if (error.message.includes('JWT')) {
          toast.error("Session expired. Please log in again.");
        } else if (retryCount < MAX_RETRIES) {
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
    if (session && !selectedDeviceId && !isLoading) {
      fetchFirstDevice();
    }
  }, [session, selectedDeviceId]);

  if (sessionLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-4">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to view this content.</p>
        </div>
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
            <ClipboardList className="w-4 h-4" />
            Annotation
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Quality
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulation" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading device data...</span>
            </div>
          ) : selectedDeviceId ? (
            <SimulationDashboard 
              deviceId={selectedDeviceId}
              simulatedData={simulatedData}
            />
          ) : (
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">No Device Selected</h2>
              <p className="text-gray-600 mb-4">Please add a PLC device to get started.</p>
              <Button 
                onClick={() => {
                  setRetryCount(0);
                  fetchFirstDevice();
                }}
                className="mt-2"
              >
                Retry Loading Device
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="annotation">
          <AnnotationDashboard />
        </TabsContent>

        <TabsContent value="quality">
          <div className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quality Control Dashboard</h3>
            <p className="text-gray-600">Coming soon! Monitor and manage data quality reviews.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}