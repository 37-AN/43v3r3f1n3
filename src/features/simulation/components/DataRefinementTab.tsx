import { useState } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RefinementHeader } from "./refinement/RefinementHeader";
import { RefinementProgress } from "./refinement/RefinementProgress";
import { RefinementAnalysis } from "./refinement/RefinementAnalysis";
import { DataStatus } from "./refinement/DataStatus";

interface DataRefinementTabProps {
  deviceId: string;
  simulatedData: Record<string, number>;
}

export function DataRefinementTab({ deviceId, simulatedData }: DataRefinementTabProps) {
  const [isRefining, setIsRefining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<{
    metricsProcessed: number;
    qualityScore: number;
    anomalies: number;
  } | null>(null);

  const handleRefineData = async () => {
    if (!deviceId || Object.keys(simulatedData).length === 0) {
      toast.error("No data available for refinement");
      return;
    }

    setIsRefining(true);
    setProgress(0);
    setAnalysis(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      console.log('Starting data refinement with simulated data:', simulatedData);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('No active session');
      }

      // Format metrics with proper structure
      const metrics = Object.entries(simulatedData).map(([key, value]) => ({
        metric_type: key,
        value: Number(value),
        timestamp: new Date().toISOString(),
        unit: key.includes('temperature') ? '°C' : 
              key.includes('pressure') ? 'bar' : 
              key.includes('flow') ? 'm³/s' : 
              'units',
        metadata: {
          quality_score: 0.95,
          source: 'simulation_engine',
          error_state: null
        }
      }));

      // Send data to refinery with proper structure
      const refineryRequestBody = {
        rawData: {
          deviceId,
          metrics,
          timestamp: new Date().toISOString(),
          metadata: {
            simulation: true,
            source: 'simulation_engine',
            quality_score: 0.95,
            owner_id: session.user.id
          }
        }
      };

      console.log('Sending data to refinery:', JSON.stringify(refineryRequestBody, null, 2));

      const { data: refinedData, error: refineryError } = await supabase.functions.invoke(
        'industrial-data-refinery',
        {
          body: refineryRequestBody
        }
      );

      if (refineryError) {
        console.error('Error in data refinement:', refineryError);
        throw refineryError;
      }

      console.log('Received refined data:', refinedData);

      // Send to AI analysis for annotation
      const { data: annotationResult, error: annotationError } = await supabase.functions.invoke(
        'annotation-ai-analysis',
        {
          body: {
            rawData: metrics,
            dataType: 'simulation',
            deviceId
          }
        }
      );

      if (annotationError) {
        console.error('Error in annotation analysis:', annotationError);
        throw annotationError;
      }

      console.log('Received annotation result:', annotationResult);

      clearInterval(progressInterval);
      
      // Calculate analysis metrics
      const qualityScores = metrics.map(m => m.metadata.quality_score);
      const avgQualityScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
      
      setAnalysis({
        metricsProcessed: metrics.length,
        qualityScore: avgQualityScore,
        anomalies: metrics.filter(m => m.metadata.error_state !== null).length
      });

      setProgress(100);
      toast.success("Data refined and annotated successfully");

      setTimeout(() => {
        setIsRefining(false);
        setProgress(0);
      }, 2000);

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error in data refinement:', error);
      toast.error("Failed to refine and annotate data");
      setIsRefining(false);
      setProgress(0);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <RefinementHeader 
          isRefining={isRefining}
          onRefine={handleRefineData}
          hasData={deviceId !== '' && Object.keys(simulatedData).length > 0}
        />

        {isRefining && <RefinementProgress progress={progress} />}

        {analysis && <RefinementAnalysis analysis={analysis} />}

        <DataStatus dataCount={Object.keys(simulatedData).length} />
      </div>
    </Card>
  );
}