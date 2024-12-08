import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSimulationState() {
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  useEffect(() => {
    const checkSimulationState = async () => {
      console.log('Checking initial simulation state');
      
      const { data, error } = await supabase
        .from('device_simulations')
        .select('is_running')
        .eq('is_running', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking simulation state:', error);
        return;
      }

      const isRunning = data?.is_running || false;
      console.log('Initial simulation state:', isRunning);
      setIsSimulationRunning(isRunning);
    };

    checkSimulationState();

    // Subscribe to simulation state changes
    console.log('Setting up simulation state subscription');
    const stateChannel = supabase
      .channel('simulation_state')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_simulations'
        },
        (payload) => {
          console.log('Simulation state changed:', payload);
          const newState = payload.new as any;
          setIsSimulationRunning(newState.is_running);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up simulation state subscription');
      stateChannel.unsubscribe();
    };
  }, []);

  return isSimulationRunning;
}