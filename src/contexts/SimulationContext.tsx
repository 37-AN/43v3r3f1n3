
import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useSimulationState } from '@/hooks/useSimulationState';
import { toast } from "sonner";

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
    const initializeSimulation = async () => {
      try {
        console.log('Initializing simulation state...');
        await loadSimulationState();
        
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
          console.log('Cleaning up simulation subscription');
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing simulation:', error);
        toast.error('Failed to initialize simulation. Please refresh the page.');
      }
    };

    initializeSimulation();
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
