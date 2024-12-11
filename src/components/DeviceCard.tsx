import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { updateDeviceMetrics } from "@/utils/metricCalculations";
import { DeviceSimulation, isValidSimulationPayload } from "@/types/simulation";
import { DeviceMetrics } from "./device/DeviceMetrics";
import { DeviceControls } from "./device/DeviceControls";
import { DeviceMetric } from "@/types/device";
import { validateDeviceAccess } from "./device/DeviceValidation";
import { startSimulation, stopSimulation } from "./device/DeviceSimulation";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface DeviceCardProps {
  name: string;
  status: "active" | "warning" | "error";
  metrics: DeviceMetric[];
  className?: string;
  deviceId: string;
}

export function DeviceCard({ name, status, metrics, className, deviceId }: DeviceCardProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localMetrics, setLocalMetrics] = useState(metrics);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  const fetchSimulationStatus = async () => {
    try {
      if (!await validateDeviceAccess(supabase, deviceId)) {
        return;
      }

      const { data, error } = await supabase
        .from('device_simulations')
        .select('is_running, parameters')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error checking simulation status:', error);
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying fetch attempt ${retryCount + 1} of ${MAX_RETRIES}...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchSimulationStatus();
          }, RETRY_DELAY * (retryCount + 1));
          return;
        }
        toast.error('Failed to check simulation status');
        return;
      }

      setRetryCount(0); // Reset retry count on successful fetch
      if (data) {
        console.log('Initial simulation status for device:', deviceId, data);
        setIsSimulating(data.is_running || false);
      }
    } catch (error) {
      console.error('Error in simulation check:', error);
      toast.error('Failed to check simulation status');
    }
  };

  useEffect(() => {
    fetchSimulationStatus();

    const simulationChanges = supabase
      .channel(`device_simulations_${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_simulations',
          filter: `device_id=eq.${deviceId}`
        },
        (payload: RealtimePostgresChangesPayload<DeviceSimulation>) => {
          console.log('Simulation update received:', payload);
          if (payload.new && isValidSimulationPayload(payload.new)) {
            const simulationData = payload.new;
            setIsSimulating(simulationData.is_running);
            setLocalMetrics(prev => 
              updateDeviceMetrics(prev, simulationData.parameters)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status:`, status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to realtime changes');
          toast.error('Error connecting to real-time updates');
        }
      });

    return () => {
      simulationChanges.unsubscribe();
    };
  }, [deviceId, retryCount]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSimulating) {
      interval = setInterval(() => {
        setLocalMetrics(prev => updateDeviceMetrics(prev, null));
      }, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isSimulating]);

  const toggleSimulation = async () => {
    setIsLoading(true);
    try {
      if (!isSimulating) {
        const result = await startSimulation(deviceId);
        if (!result) return;
      } else {
        const success = await stopSimulation(deviceId);
        if (!success) return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn("p-6 animate-fade-up glass-panel", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-system-gray-900">{name}</h3>
        <DeviceControls
          status={status}
          isSimulating={isSimulating}
          isLoading={isLoading}
          onToggleSimulation={toggleSimulation}
        />
      </div>
      <DeviceMetrics metrics={localMetrics} />
    </Card>
  );
}