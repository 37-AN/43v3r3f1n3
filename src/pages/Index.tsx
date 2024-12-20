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
import { Loader2, ClipboardList, Database, Shield, Check, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnotationDashboard } from "@/components/annotation/AnnotationDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

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

  const { data: qualityStats, isLoading: isLoadingQuality } = useQuery({
    queryKey: ["quality-reviews"],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("quality_reviews")
        .select(`
          status,
          feedback,
          annotations (
            id,
            status,
            annotation_data
          )
        `);

      if (error) throw error;

      const stats = {
        total: reviews?.length || 0,
        pending: reviews?.filter(r => r.status === 'pending').length || 0,
        approved: reviews?.filter(r => r.status === 'approved').length || 0,
        rejected: reviews?.filter(r => r.status === 'rejected').length || 0,
      };

      return stats;
    },
    enabled: !!session
  });

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
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Quality Control Dashboard</h2>
              <p className="text-muted-foreground">Monitor and manage annotation quality reviews</p>
            </div>

            {isLoadingQuality ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-[140px]" />
                <Skeleton className="h-[140px]" />
                <Skeleton className="h-[140px]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{qualityStats?.total || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Total quality reviews conducted
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <Check className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{qualityStats?.approved || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Annotations approved by reviewers
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{qualityStats?.pending || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Annotations awaiting review
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {!isLoadingQuality && qualityStats?.total === 0 && (
              <Card className="mt-6">
                <CardContent className="py-12 text-center">
                  <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Quality Reviews Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start annotating data to generate quality reviews.
                  </p>
                  <Button
                    onClick={() => document.querySelector('[value="annotation"]')?.click()}
                    variant="outline"
                  >
                    Go to Annotation
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
