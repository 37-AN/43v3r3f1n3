import { Card } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SimulationControls } from "./SimulationControls";
import { SimulationParameterRange } from "./SimulationParameterRange";
import { SimulationParameters, defaultParameters } from "@/types/simulation";
import { Json } from "@/integrations/supabase/types";

interface SimulationConfig {
  deviceId: string;
  updateInterval: number;
  simulationType: 'normal' | 'anomaly';
  parameters: SimulationParameters;
}

export function SimulationConfig() {
  const [config, setConfig] = useState<SimulationConfig>({
    deviceId: 'e2fae487-1ee2-4ea2-b87f-decedb7d12a5',
    updateInterval: 2000,
    simulationType: 'normal',
    parameters: defaultParameters
  });

  const [isRunning, setIsRunning] = useState(false);

  const handleSimulation = async (start: boolean) => {
    try {
      console.log(`${start ? 'Starting' : 'Stopping'} simulation with config:`, config);
      
      const { data: existingSimulation } = await supabase
        .from('device_simulations')
        .select('*')
        .eq('device_id', config.deviceId)
        .single();

      const simulationParameters: Record<string, unknown> = {
        updateInterval: config.updateInterval,
        simulationType: config.simulationType,
        parameters: Object.entries(config.parameters).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: { min: value.min, max: value.max }
        }), {})
      };

      const simulationData = {
        device_id: config.deviceId,
        simulation_type: 'industrial',
        parameters: simulationParameters as Json,
        is_running: start
      };

      let error;
      if (existingSimulation) {
        ({ error } = await supabase
          .from('device_simulations')
          .update(simulationData)
          .eq('id', existingSimulation.id));
      } else {
        ({ error } = await supabase
          .from('device_simulations')
          .insert(simulationData));
      }

      if (error) throw error;
      
      setIsRunning(start);
      toast.success(`Simulation ${start ? 'started' : 'stopped'} successfully`);
    } catch (error) {
      console.error(`Error ${start ? 'starting' : 'stopping'} simulation:`, error);
      toast.error(`Failed to ${start ? 'start' : 'stop'} simulation`);
    }
  };

  const handleParameterChange = (key: string, min: number, max: number) => {
    setConfig(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: { min, max }
      }
    }));
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Industrial Process Simulator</h2>
      
      <SimulationControls
        updateInterval={config.updateInterval}
        simulationType={config.simulationType}
        onUpdateIntervalChange={(interval) => setConfig(prev => ({ ...prev, updateInterval: interval }))}
        onSimulationTypeChange={(type) => setConfig(prev => ({ ...prev, simulationType: type }))}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(config.parameters).map(([key, value]) => (
          <SimulationParameterRange
            key={key}
            parameterKey={key}
            value={value}
            onChange={handleParameterChange}
          />
        ))}
      </div>

      <div className="flex justify-end gap-4">
        {!isRunning ? (
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => handleSimulation(true)}
          >
            Start Simulation
          </button>
        ) : (
          <button 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            onClick={() => handleSimulation(false)}
          >
            Stop Simulation
          </button>
        )}
      </div>
    </Card>
  );
}