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

  useEffect(() => {
    console.log('Setting up real-time subscription for simulation data');
    
    const channel = supabase
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
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          toast.success('Connected to real-time data stream');
        }
      });

    return () => {
      console.log('Cleaning up subscription');
      channel.unsubscribe();
    };
  }, []);

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