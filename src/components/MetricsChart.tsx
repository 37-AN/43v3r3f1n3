import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface ModbusRegisterData {
  timestamp: string;
  value: number;
  registerType: 'coil' | 'discrete' | 'input' | 'holding';
  address: number;
}

interface MetricsChartProps {
  title: string;
  data: ModbusRegisterData[];
  className?: string;
  registerType: 'coil' | 'discrete' | 'input' | 'holding';
}

export function MetricsChart({ title, data, className, registerType }: MetricsChartProps) {
  const getRegisterColor = (type: string) => {
    switch (type) {
      case 'coil': return "#34C759";
      case 'discrete': return "#FF9500";
      case 'input': return "#5856D6";
      case 'holding': return "#FF2D55";
      default: return "#34C759";
    }
  };

  return (
    <Card className={cn("p-6 animate-fade-up glass-panel h-[400px]", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-system-gray-900">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Register Type: {registerType.charAt(0).toUpperCase() + registerType.slice(1)}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {data.length > 0 ? data[data.length - 1].timestamp : 'N/A'}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
          <XAxis
            dataKey="timestamp"
            stroke="#8E8E93"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#8E8E93" 
            fontSize={12} 
            tickLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(value) => registerType === 'coil' || registerType === 'discrete' ? 
              value.toString() : value.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: number, name: string) => [
              registerType === 'coil' || registerType === 'discrete' ? 
                value.toString() : value.toFixed(2),
              `${title} (Address: ${data[0]?.address})`
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={getRegisterColor(registerType)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={true}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}