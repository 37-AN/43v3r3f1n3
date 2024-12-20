import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useSimulationState } from '@/hooks/useSimulationState';

interface SimulationContextType {
  simulationState: ReturnType<typeof useSimulationState>['simulationState'];
  startSimulation: () => Promise<void>;
  stopSimulation: () => Promise<void>;
  updateRegister: ReturnType<typeof useSimulationState>['updateRegister'];
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const {
    simulationState,
    startSimulation,
    stopSimulation,
    updateRegister,
    loadSimulationState
  } = useSimulationState();

  useEffect(() => {
    loadSimulationState();
    const subscription = supabase
      .channel('device_simulations_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'device_simulations' 
      }, () => {
        console.log('Simulation update received, reloading state');
        loadSimulationState();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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