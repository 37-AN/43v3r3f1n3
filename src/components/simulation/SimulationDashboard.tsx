import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MetricsChart } from "@/components/MetricsChart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SimulationData {
  timestamp: string;
  data_type: string;
  value: number;
}

export function SimulationDashboard() {
  const [data, setData] = useState<Record<string, SimulationData[]>>({});

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('simulation_data')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arduino_plc_data',
          filter: 'device_id=eq.e2fae487-1ee2-4ea2-b87f-decedb7d12a5'
        },
        (payload) => {
          console.log('Received new simulation data:', payload);
          const newData = payload.new as any;
          
          setData(prev => {
            const updatedData = { ...prev };
            const dataType = newData.data_type;
            
            if (!updatedData[dataType]) {
              updatedData[dataType] = [];
            }
            
            updatedData[dataType] = [
              ...updatedData[dataType],
              {
                timestamp: new Date().toLocaleTimeString(),
                data_type: dataType,
                value: newData.value
              }
            ].slice(-50); // Keep last 50 points
            
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
      channel.unsubscribe();
    };
  }, []);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Real-time Simulation Data</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(data).map(([dataType, values]) => (
          <MetricsChart
            key={dataType}
            title={`${dataType.replace('_', ' ').toUpperCase()}`}
            data={values.map(d => ({
              timestamp: d.timestamp,
              value: d.value,
              registerType: 'input',
              address: 1
            }))}
            registerType="input"
            className="transition-transform hover:scale-[1.01]"
          />
        ))}
      </div>
    </Card>
  );
}