import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

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

      console.log('Sending data to refinery:', requestBody);

      const { data, error } = await supabase.functions.invoke('industrial-data-refinery', {
        body: requestBody
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('Error from refinery:', error);
        throw error;
      }

      console.log('Received refined data:', data);
      setProgress(100);
      toast.success("Data refined and stored successfully");

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
          <h3 className="text-lg font-semibold">Data Refinement</h3>
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
              "Refine Data"
            )}
          </Button>
        </div>

        {progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {progress === 100 ? "Refinement complete!" : "Processing data..."}
            </p>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          {Object.keys(simulatedData).length > 0 ? (
            <p>
              {Object.keys(simulatedData).length} metrics available for refinement
            </p>
          ) : (
            <p>No data available for refinement</p>
          )}
        </div>
      </div>
    </Card>
  );
}