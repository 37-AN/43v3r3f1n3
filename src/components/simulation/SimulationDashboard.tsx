import { Card } from "@/components/ui/card";
import { MetricsChart } from "@/components/MetricsChart";
import { useEffect, useState } from "react";
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

export function SimulationDashboard() {
  const [chartData, setChartData] = useState<ChartData>({});
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  // Check initial simulation state
  useEffect(() => {
    const checkSimulationState = async () => {
      console.log('Checking initial simulation state');
      const { data, error } = await supabase
        .from('device_simulations')
        .select('is_running')
        .single();

      if (error) {
        console.error('Error checking simulation state:', error);
        return;
      }

      console.log('Initial simulation state:', data?.is_running);
      setIsSimulationRunning(data?.is_running || false);
    };

    checkSimulationState();
  }, []);

  // Subscribe to simulation state changes
  useEffect(() => {
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
          
          if (!newState.is_running) {
            // Clear chart data when simulation stops
            setChartData({});
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up simulation state subscription');
      stateChannel.unsubscribe();
    };
  }, []);

  // Subscribe to simulation data only when simulation is running
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

  if (!isSimulationRunning) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Real-time Simulation Data</h2>
        <p className="text-muted-foreground text-center py-8">
          Start the simulation to see real-time data visualization
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Real-time Simulation Data</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(chartData).map(([dataType, values]) => (
          <MetricsChart
            key={dataType}
            title={`${dataType.replace('_', ' ').toUpperCase()}`}
            data={values}
            registerType="input"
            className="transition-transform hover:scale-[1.01]"
          />
        ))}
      </div>
    </Card>
  );
}