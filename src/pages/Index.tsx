import { useEffect, useState } from "react";
import { initializeAIModels, refineData, type TimeSeriesDataPoint } from "@/utils/dataRefinement";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TokenizeDeviceDialog } from "@/components/TokenizeDeviceDialog";
import { Header } from "@/components/Header";
import { DeviceGrid } from "@/components/DeviceGrid";
import { MetricsSection } from "@/components/MetricsSection";

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
  const [tokenizedAssets, setTokenizedAssets] = useState([]);
  const [isTokenizeDialogOpen, setIsTokenizeDialogOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get current user's email
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        console.log("Current user email:", user.email);
        setUserEmail(user.email);
      }
    });

    fetchTokenizedAssets();
    processData();
  }, []);

  const fetchTokenizedAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('tokenized_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokenizedAssets(data);
      console.log('Fetched tokenized assets:', data);
    } catch (error) {
      console.error('Error fetching tokenized assets:', error);
      toast.error('Failed to load tokenized assets');
    }
  };

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

  return (
    <div className="min-h-screen bg-system-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Header 
          userEmail={userEmail}
          isProcessing={isProcessing}
          onTokenizeClick={() => setIsTokenizeDialogOpen(true)}
        />
        
        <DeviceGrid />
        
        <MetricsSection 
          refinedPerformance={refinedPerformance}
          refinedResources={refinedResources}
        />

        <TokenizeDeviceDialog 
          open={isTokenizeDialogOpen} 
          onOpenChange={setIsTokenizeDialogOpen}
          onSuccess={fetchTokenizedAssets}
        />
      </div>
    </div>
  );
}