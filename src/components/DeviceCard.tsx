import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { updateDeviceMetrics } from "@/utils/metricCalculations";
import { DeviceSimulation, isValidSimulationPayload } from "@/types/simulation";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { DeviceMetrics } from "./device/DeviceMetrics";
import { DeviceControls } from "./device/DeviceControls";
import { DeviceMetric } from "@/types/device";

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

  useEffect(() => {
    const checkSimulationStatus = async () => {
      const { data, error } = await supabase
        .from('device_simulations')
        .select('is_running, parameters')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        console.log('Initial simulation status for device:', deviceId, data);
        setIsSimulating(data.is_running || false);
      }
    };

    checkSimulationStatus();

    const simulationChanges = supabase
      .channel(`device_simulations_${deviceId}`)
      .on(
        'postgres_changes' as const,
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
      .subscribe();

    return () => {
      simulationChanges.unsubscribe();
    };
  }, [deviceId]);

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
        const { data, error } = await supabase
          .from('device_simulations')
          .insert([
            {
              device_id: deviceId,
              simulation_type: 'modbus',
              parameters: {
                port: 502,
                slave_id: 1,
                registers: [
                  { address: 0, value: Math.floor(Math.random() * 1000) },
                  { address: 1, value: Math.floor(Math.random() * 1000) }
                ]
              },
              is_running: true
            }
          ])
          .select()
          .single();

        if (error) throw error;
        console.log('Started simulation:', data);
        toast.success('Simulation started');
      } else {
        const { error } = await supabase
          .from('device_simulations')
          .update({ is_running: false })
          .eq('device_id', deviceId);

        if (error) throw error;
        console.log('Stopped simulation for device:', deviceId);
        toast.success('Simulation stopped');
      }
    } catch (error) {
      console.error('Error toggling simulation:', error);
      toast.error('Failed to toggle simulation');
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