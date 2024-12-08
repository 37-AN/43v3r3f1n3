import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { defaultParameters } from "@/types/simulation";

interface SimulationConfigProps {
  deviceId: string;
  onClose?: () => void;
}

export function SimulationConfig({ deviceId, onClose }: SimulationConfigProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulation = async (start: boolean) => {
    setIsLoading(true);
    try {
      console.log(`${start ? 'Starting' : 'Stopping'} simulation for device:`, deviceId);
      
      // First, stop any existing simulations for this device
      const { error: stopError } = await supabase
        .from('device_simulations')
        .update({ is_running: false })
        .eq('device_id', deviceId);

      if (stopError) {
        console.error('Error stopping existing simulations:', stopError);
        throw stopError;
      }

      if (start) {
        // Create a new simulation record
        const simulationParameters: Record<string, unknown> = {
          updateInterval: 2000,
          simulationType: 'normal',
          parameters: Object.entries(defaultParameters).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: { min: value.min, max: value.max }
          }), {})
        };

        const simulationData = {
          device_id: deviceId,
          simulation_type: 'industrial',
          parameters: simulationParameters as Json,
          is_running: true
        };

        const { error: startError } = await supabase
          .from('device_simulations')
          .insert(simulationData);

        if (startError) throw startError;
      }
      
      toast.success(`Simulation ${start ? 'started' : 'stopped'} successfully`);
      if (onClose) onClose();
    } catch (error) {
      console.error('Error managing simulation:', error);
      toast.error(`Failed to ${start ? 'start' : 'stop'} simulation`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Simulation Configuration</h3>
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => handleSimulation(false)}
          disabled={isLoading}
        >
          Stop Simulation
        </Button>
        <Button
          onClick={() => handleSimulation(true)}
          disabled={isLoading}
        >
          Start Simulation
        </Button>
      </div>
    </div>
  );
}