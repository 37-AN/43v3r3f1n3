import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SimulationConfig {
  deviceId: string;
  updateInterval: number;
  simulationType: 'normal' | 'anomaly';
  parameters: {
    temperature: { min: number; max: number; };
    pressure: { min: number; max: number; };
    vibration: { min: number; max: number; };
    production_rate: { min: number; max: number; };
  };
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
      const { error } = await supabase
        .from('device_simulations')
        .upsert({
          device_id: config.deviceId,
          simulation_type: 'industrial',
          parameters: config,
          is_running: true
        });

      if (error) throw error;
      
      setIsRunning(true);
      toast.success('Simulation started successfully');
    } catch (error) {
      console.error('Error starting simulation:', error);
      toast.error('Failed to start simulation');
    }
  };

  const stopSimulation = async () => {
    try {
      const { error } = await supabase
        .from('device_simulations')
        .update({ is_running: false })
        .eq('device_id', config.deviceId);

      if (error) throw error;
      
      setIsRunning(false);
      toast.success('Simulation stopped successfully');
    } catch (error) {
      console.error('Error stopping simulation:', error);
      toast.error('Failed to stop simulation');
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Industrial Data Simulator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Update Interval (ms)</Label>
          <Input
            type="number"
            value={config.updateInterval}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              updateInterval: parseInt(e.target.value)
            }))}
            min={1000}
            max={10000}
          />
        </div>

        <div className="space-y-2">
          <Label>Simulation Type</Label>
          <Select
            value={config.simulationType}
            onValueChange={(value: 'normal' | 'anomaly') => 
              setConfig(prev => ({ ...prev, simulationType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal Operation</SelectItem>
              <SelectItem value="anomaly">Anomaly Simulation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {Object.entries(config.parameters).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <Label className="capitalize">{key.replace('_', ' ')} Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={value.min}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  parameters: {
                    ...prev.parameters,
                    [key]: { ...value, min: parseFloat(e.target.value) }
                  }
                }))}
                placeholder="Min"
              />
              <Input
                type="number"
                value={value.max}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  parameters: {
                    ...prev.parameters,
                    [key]: { ...value, max: parseFloat(e.target.value) }
                  }
                }))}
                placeholder="Max"
              />
            </div>
          </div>
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