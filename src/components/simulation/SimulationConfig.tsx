import { Card } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SimulationControls } from "./SimulationControls";
import { SimulationParameterRange } from "./SimulationParameterRange";
import { Json } from "@/integrations/supabase/types";

interface ParameterRange {
  min: number;
  max: number;
}

interface SimulationParameters {
  temperature: ParameterRange;
  pressure: ParameterRange;
  vibration: ParameterRange;
  production_rate: ParameterRange;
  downtime_minutes: ParameterRange;
  defect_rate: ParameterRange;
  energy_consumption: ParameterRange;
  machine_efficiency: ParameterRange;
}

const defaultParameters: SimulationParameters = {
  temperature: { min: 20, max: 80 },
  pressure: { min: 0, max: 100 },
  vibration: { min: 0, max: 50 },
  production_rate: { min: 50, max: 200 },
  downtime_minutes: { min: 0, max: 60 },
  defect_rate: { min: 0, max: 5 },
  energy_consumption: { min: 50, max: 150 },
  machine_efficiency: { min: 70, max: 100 }
};

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
      
      // First, check if there's an existing simulation for this device
      const { data: existingSimulation } = await supabase
        .from('device_simulations')
        .select('*')
        .eq('device_id', config.deviceId)
        .single();

      // Convert parameters to a format compatible with Json type
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
        // Update existing simulation
        ({ error } = await supabase
          .from('device_simulations')
          .update(simulationData)
          .eq('id', existingSimulation.id));
      } else {
        // Create new simulation
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