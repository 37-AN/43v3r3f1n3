import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SimulationData {
  timestamp: string;
  data_type: string;
  value: number;
}

interface ChartData {
  [key: string]: {
    timestamp: string;
    value: number;
    registerType: 'input';
    address: number;
  }[];
}

export function useSimulationData(isSimulationRunning: boolean) {
  const [chartData, setChartData] = useState<ChartData>({});

  useEffect(() => {
    if (!isSimulationRunning) {
      console.log('Simulation not running, skipping data subscription');
      return;
    }

    console.log('Setting up real-time subscription for simulation data');
    const dataChannel = supabase
      .channel('simulation_data')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arduino_plc_data'
        },
        (payload) => {
          console.log('Received new simulation data:', payload);
          const newData = payload.new as SimulationData;
          
          setChartData(prev => {
            const dataType = newData.data_type;
            const newPoint = {
              timestamp: new Date().toLocaleTimeString(),
              value: newData.value,
              registerType: 'input' as const,
              address: 1
            };
            
            const updatedData = {
              ...prev,
              [dataType]: [...(prev[dataType] || []), newPoint].slice(-50) // Keep last 50 points
            };
            
            return updatedData;
          });
        }
      )
      .subscribe((status) => {
        console.log('Data subscription status:', status);
        if (status === 'SUBSCRIBED') {
          toast.success('Connected to real-time data stream');
        }
      });

    return () => {
      console.log('Cleaning up data subscription');
      dataChannel.unsubscribe();
    };
  }, [isSimulationRunning]);

  return chartData;
}