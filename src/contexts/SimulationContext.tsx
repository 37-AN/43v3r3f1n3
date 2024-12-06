import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ModbusRegister {
  address: number;
  value: number;
  type: 'coil' | 'discrete' | 'input' | 'holding';
}

interface SimulationState {
  isRunning: boolean;
  port: number;
  slaveId: number;
  registers: ModbusRegister[];
}

interface SimulationContextType {
  simulationState: SimulationState;
  startSimulation: () => Promise<void>;
  stopSimulation: () => Promise<void>;
  updateRegister: (address: number, value: number, type: ModbusRegister['type']) => Promise<void>;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    port: 5020,
    slaveId: 1,
    registers: []
  });

  useEffect(() => {
    loadSimulationState();
    const subscription = supabase
      .channel('device_simulations_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'device_simulations' 
      }, handleSimulationUpdate)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSimulationState = async () => {
    try {
      const { data, error } = await supabase
        .from('device_simulations')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        console.log('Loaded simulation state:', data);
        setSimulationState({
          isRunning: data.is_running,
          port: data.parameters.port || 5020,
          slaveId: data.parameters.slave_id || 1,
          registers: data.parameters.registers || []
        });
      }
    } catch (error) {
      console.error('Error loading simulation state:', error);
      toast.error('Failed to load simulation state');
    }
  };

  const handleSimulationUpdate = (payload: any) => {
    console.log('Simulation update received:', payload);
    loadSimulationState();
  };

  const startSimulation = async () => {
    try {
      const { error } = await supabase
        .from('device_simulations')
        .update({ is_running: true })
        .eq('id', 1);

      if (error) throw error;
      
      setSimulationState(prev => ({ ...prev, isRunning: true }));
      toast.success('Simulation started');
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
        .eq('id', 1);

      if (error) throw error;
      
      setSimulationState(prev => ({ ...prev, isRunning: false }));
      toast.success('Simulation stopped');
    } catch (error) {
      console.error('Error stopping simulation:', error);
      toast.error('Failed to stop simulation');
    }
  };

  const updateRegister = async (address: number, value: number, type: ModbusRegister['type']) => {
    try {
      const updatedRegisters = simulationState.registers.map(reg =>
        reg.address === address && reg.type === type
          ? { ...reg, value }
          : reg
      );

      const { error } = await supabase
        .from('device_simulations')
        .update({
          parameters: {
            ...simulationState,
            registers: updatedRegisters
          }
        })
        .eq('id', 1);

      if (error) throw error;
      
      setSimulationState(prev => ({
        ...prev,
        registers: updatedRegisters
      }));
      
      console.log(`Updated register ${address} to value ${value}`);
    } catch (error) {
      console.error('Error updating register:', error);
      toast.error('Failed to update register');
    }
  };

  return (
    <SimulationContext.Provider value={{
      simulationState,
      startSimulation,
      stopSimulation,
      updateRegister
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}