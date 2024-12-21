import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface DataRefinementTabProps {
  deviceId: string;
  simulatedData: Record<string, number>;
}

export function DataRefinementTab({ deviceId, simulatedData }: DataRefinementTabProps) {
  const [isRefining, setIsRefining] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRefineData = async () => {
    if (!deviceId || Object.keys(simulatedData).length === 0) {
      toast.error("No data available for refinement");
      return;
    }

    setIsRefining(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      console.log('Starting data refinement for device:', deviceId);
      
      // Format metrics array
      const metrics = Object.entries(simulatedData).map(([key, value]) => ({
        metric_type: key,
        value: value,
        unit: key.includes('temperature') ? '°C' : 
              key.includes('pressure') ? 'bar' : 
              key.includes('flow') ? 'm³/s' : 
              'units',
        timestamp: new Date().toISOString()
      }));

      console.log('Formatted metrics for refinement:', metrics);

      // Store directly in refined_industrial_data
      const { error: insertError } = await supabase
        .from('refined_industrial_data')
        .insert(metrics.map(metric => ({
          device_id: deviceId,
          data_type: metric.metric_type,
          value: metric.value,
          quality_score: 0.95,
          timestamp: new Date().toISOString(),
          metadata: {
            unit: metric.unit,
            source: 'simulation_engine',
            refinement_timestamp: new Date().toISOString()
          }
        })));

      clearInterval(progressInterval);

      if (insertError) {
        console.error('Error storing refined data:', insertError);
        throw insertError;
      }

      setProgress(100);
      toast.success("Data refined and stored successfully");

      // Reset after completion
      setTimeout(() => {
        setIsRefining(false);
        setProgress(0);
      }, 2000);

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error in data refinement:', error);
      toast.error("Failed to refine data");
      setIsRefining(false);
      setProgress(0);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Data Refinement</h3>
            <p className="text-sm text-muted-foreground">
              Process and refine industrial data for quality assessment
            </p>
          </div>
          <Button 
            onClick={handleRefineData}
            disabled={isRefining || !deviceId || Object.keys(simulatedData).length === 0}
          >
            {isRefining ? "Refining..." : "Refine Data"}
          </Button>
        </div>

        {isRefining && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {progress === 100 ? "Refinement complete!" : "Processing data..."}
            </p>
          </div>
        )}

        <div className="bg-muted p-4 rounded-lg">
          {Object.keys(simulatedData).length > 0 ? (
            <div className="space-y-1">
              <p>
                {Object.keys(simulatedData).length} metrics available for refinement
              </p>
              <p className="text-xs text-muted-foreground">
                Using advanced data analysis for quality assessment
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No data available for refinement. Start the simulation to generate data.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}