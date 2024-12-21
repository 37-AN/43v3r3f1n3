import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Brain } from "lucide-react";

interface DataRefinementTabProps {
  deviceId: string;
  simulatedData: Record<string, number>;
}

export function DataRefinementTab({ deviceId, simulatedData }: DataRefinementTabProps) {
  const [isRefining, setIsRefining] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRefineData = async () => {
    if (!deviceId || !simulatedData) {
      toast.error("No data available for refinement");
      return;
    }

    try {
      setIsRefining(true);
      setProgress(0);

      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Format metrics array with proper structure
      const metrics = Object.entries(simulatedData).map(([key, value]) => ({
        metric_type: key,
        value: typeof value === 'number' ? value : 0,
        unit: key === 'temperature' ? '°C' :
              key === 'pressure' ? 'bar' :
              key === 'vibration' ? 'mm/s' :
              key === 'production_rate' ? 'units/hr' :
              key === 'downtime_minutes' ? 'min' :
              key === 'defect_rate' ? '%' :
              key === 'energy_consumption' ? 'kWh' :
              key === 'machine_efficiency' ? '%' : 'unit',
        metadata: {
          quality_score: 0.95,
          source: 'simulation_engine'
        }
      }));

      const requestBody = {
        rawData: {
          deviceId,
          metrics,
          timestamp: new Date().toISOString(),
          metadata: {
            simulation: true,
            source: 'simulation_engine',
            quality_score: 0.95
          }
        }
      };

      console.log('Sending data to AI refinery:', requestBody);

      // Call the AI-powered data refinery
      const { data, error } = await supabase.functions.invoke('industrial-data-refinery-ai', {
        body: requestBody
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('Error from AI refinery:', error);
        throw error;
      }

      console.log('Received AI-refined data:', data);
      setProgress(100);
      toast.success("Data refined with AI analysis and stored successfully");

      // Reset after completion
      setTimeout(() => {
        setProgress(0);
        setIsRefining(false);
      }, 2000);

    } catch (error) {
      console.error('Error refining data:', error);
      toast.error("Failed to refine data");
      setIsRefining(false);
      setProgress(0);
    }
  };

  return (
    <Card className="p-6 animate-fade-up">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">AI-Powered Data Refinement</h3>
            <p className="text-sm text-muted-foreground">
              Refine industrial data using advanced AI analysis
            </p>
          </div>
          <Button 
            onClick={handleRefineData} 
            disabled={isRefining}
            className="min-w-[120px]"
          >
            {isRefining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refining...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Refine Data
              </>
            )}
          </Button>
        </div>

        {progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {progress === 100 ? "AI refinement complete!" : "Processing data with AI..."}
            </p>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          {Object.keys(simulatedData).length > 0 ? (
            <div className="space-y-1">
              <p>
                {Object.keys(simulatedData).length} metrics available for AI refinement
              </p>
              <p className="text-xs text-muted-foreground">
                Using HuggingFace Falcon-7B for intelligent data analysis
              </p>
            </div>
          ) : (
            <p>No data available for refinement</p>
          )}
        </div>
      </div>
    </Card>
  );
}