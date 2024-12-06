import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RegisterMonitorProps {
  deviceId: string;
  registerId: string;
  address: number;
  registerType: string;
  currentValue: number;
}

export function RegisterMonitor({
  deviceId,
  registerId,
  address,
  registerType,
  currentValue,
}: RegisterMonitorProps) {
  const [value, setValue] = useState(currentValue);
  const [historicalData, setHistoricalData] = useState<Array<{ timestamp: string; value: number }>>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Subscribe to register value changes
    const channel = supabase
      .channel(`register_${registerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plc_registers',
          filter: `id=eq.${registerId}`
        },
        (payload) => {
          console.log('Register value updated:', payload);
          if (payload.new) {
            const newValue = (payload.new as any).initial_value;
            setValue(newValue);
            setHistoricalData(prev => [
              ...prev,
              { timestamp: new Date().toISOString(), value: newValue }
            ].slice(-20)); // Keep last 20 data points
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [registerId]);

  const handleValueChange = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('plc_registers')
        .update({ initial_value: value })
        .eq('id', registerId);

      if (error) throw error;
      toast.success(`Register ${address} updated to ${value}`);
    } catch (error) {
      console.error('Error updating register:', error);
      toast.error('Failed to update register value');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label>Register {address} ({registerType})</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-24"
          />
          <Button 
            onClick={handleValueChange}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Value Range Control</Label>
        <Slider
          value={[value]}
          onValueChange={(values) => setValue(values[0])}
          max={65535}
          step={1}
        />
      </div>

      <div className="h-[200px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}