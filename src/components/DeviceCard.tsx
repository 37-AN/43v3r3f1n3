import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlayCircle, StopCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { updateDeviceMetrics } from "@/utils/metricCalculations";
import { DeviceSimulation, isValidSimulationPayload } from "@/types/simulation";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface DeviceCardProps {
  name: string;
  status: "active" | "warning" | "error";
  metrics: {
    label: string;
    value: string | number;
    unit?: string;
  }[];
  className?: string;
  deviceId: string;
}

export function DeviceCard({ name, status, metrics, className, deviceId }: DeviceCardProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localMetrics, setLocalMetrics] = useState(metrics);

  // Check initial simulation status and subscribe to changes
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

    // Subscribe to simulation changes
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
            // Update metrics based on new parameters
            setLocalMetrics(prev => 
              updateDeviceMetrics(prev, simulationData.parameters)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      simulationChanges.unsubscribe();
    };
  }, [deviceId]);

  // Update metrics periodically when simulation is running
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSimulating) {
      interval = setInterval(() => {
        setLocalMetrics(prev => updateDeviceMetrics(prev, null));
      }, 2000); // Update every 2 seconds
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
        // Start simulation with initial parameters
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
        // Stop simulation
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
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            status === "active" ? "bg-green-500" : 
            status === "warning" ? "bg-yellow-500" : 
            "bg-red-500"
          )} />
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSimulation}
            disabled={isLoading}
            className={cn(
              "transition-colors",
              isSimulating ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"
            )}
          >
            {isSimulating ? (
              <StopCircle className="h-4 w-4 mr-1" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-1" />
            )}
            {isSimulating ? 'Stop' : 'Simulate'}
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {localMetrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-system-gray-500">{metric.label}</span>
            <span className="font-medium">
              {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
              {metric.unit && <span className="text-system-gray-400 ml-1">{metric.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}