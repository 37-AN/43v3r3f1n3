import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatXAxis, getRegisterColor } from "@/utils/chart/formatters";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DataPoint {
  timestamp: string;
  value: number;
  quality_score: number;
}

export function DataVisualization({ deviceId }: { deviceId: string }) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      console.log('Fetching refined industrial data for device:', deviceId);
      const { data: refinedData, error } = await supabase
        .from('refined_industrial_data')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching refined data:', error);
        toast.error('Failed to load refined data');
        return;
      }

      console.log('Received refined data:', refinedData);
      setData(refinedData.map(d => ({
        timestamp: d.timestamp,
        value: d.value,
        quality_score: d.quality_score || 0
      })));
    } catch (error) {
      console.error('Error in data fetch:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchData();

      // Set up real-time subscription
      const channel = supabase
        .channel('refined_data_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'refined_industrial_data',
            filter: `device_id=eq.${deviceId}`
          },
          (payload) => {
            console.log('New refined data received:', payload);
            setData(current => {
              const newData = [...current, {
                timestamp: payload.new.timestamp,
                value: payload.new.value,
                quality_score: payload.new.quality_score || 0
              }].slice(-100); // Keep last 100 points
              return newData;
            });
          }
        )
        .subscribe();

      return () => {
        console.log('Cleaning up real-time subscription');
        supabase.removeChannel(channel);
      };
    }
  }, [deviceId]);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Industrial Data Visualization</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              height={40}
              angle={-45}
              textAnchor="end"
            />
            <YAxis />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="text-gray-600">{new Date(label).toLocaleString()}</p>
                      <p className="font-medium">Value: {payload[0].value.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        Quality Score: {(payload[0].payload.quality_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={getRegisterColor('input')}
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}