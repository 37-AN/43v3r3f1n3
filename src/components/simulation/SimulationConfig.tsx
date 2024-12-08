import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { SimulationControls } from "./SimulationControls";
import { SimulationParameterRange } from "./SimulationParameterRange";

interface SimulationParameters {
  temperature: { min: number; max: number; };
  pressure: { min: number; max: number; };
  vibration: { min: number; max: number; };
  production_rate: { min: number; max: number; };
}

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
    parameters: {
      temperature: { min: 20, max: 80 },
      pressure: { min: 0, max: 100 },
      vibration: { min: 0, max: 50 },
      production_rate: { min: 50, max: 200 }
    }
  });

  const [isRunning, setIsRunning] = useState(false);

  const startSimulation = async () => {
    try {
      console.log('Starting simulation with config:', config);
      
      const simulationData = {
        device_id: config.deviceId,
        simulation_type: 'industrial',
        parameters: {
          ...config,
          timestamp: new Date().toISOString()
        } as unknown as Json,
        is_running: true
      };

      console.log('Sending simulation data to database:', simulationData);
      
      const { error } = await supabase
        .from('device_simulations')
        .upsert(simulationData);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      setIsRunning(true);
      toast.success('Simulation started successfully');
    } catch (error) {
      console.error('Error starting simulation:', error);
      toast.error('Failed to start simulation');
    }
  };

  const stopSimulation = async () => {
    try {
      console.log('Stopping simulation for device:', config.deviceId);
      
      const { error } = await supabase
        .from('device_simulations')
        .update({ is_running: false })
        .eq('device_id', config.deviceId);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      setIsRunning(false);
      toast.success('Simulation stopped successfully');
    } catch (error) {
      console.error('Error stopping simulation:', error);
      toast.error('Failed to stop simulation');
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
      <h2 className="text-2xl font-bold">Industrial Data Simulator</h2>
      
      <SimulationControls
        updateInterval={config.updateInterval}
        simulationType={config.simulationType}
        onUpdateIntervalChange={(interval) => setConfig(prev => ({ ...prev, updateInterval: interval }))}
        onSimulationTypeChange={(type) => setConfig(prev => ({ ...prev, simulationType: type }))}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Button onClick={startSimulation}>Start Simulation</Button>
        ) : (
          <Button onClick={stopSimulation} variant="destructive">Stop Simulation</Button>
        )}
      </div>
    </Card>
  );
}