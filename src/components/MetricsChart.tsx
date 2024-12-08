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

  // Format timestamp to handle both date objects and time strings
  const formatXAxis = (tickItem: string) => {
    try {
      // If it's already a time string (e.g., "1:51:09 PM"), return it directly
      if (tickItem.includes(':') && (tickItem.includes('AM') || tickItem.includes('PM'))) {
        console.log('Using time string directly:', tickItem);
        return tickItem;
      }

      // Otherwise, try to parse as a date
      const date = new Date(tickItem);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
      }

      console.error('Invalid timestamp format:', tickItem);
      return tickItem;
    } catch (error) {
      console.error('Error formatting date:', error);
      return tickItem;
    }
  };

  return (
    <Card className={cn(
      "w-full p-4",
      "bg-white/80 dark:bg-system-gray-800/80 backdrop-blur-lg",
      "border border-white/20 dark:border-system-gray-700/20",
      "shadow-lg",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-system-gray-900 dark:text-system-gray-100">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            Register Type: {registerType.charAt(0).toUpperCase() + registerType.slice(1)}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: {data.length > 0 ? formatXAxis(data[data.length - 1].timestamp) : 'N/A'}
        </div>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E5E5" 
              className="opacity-50"
            />
            <XAxis
              dataKey="timestamp"
              stroke="#8E8E93"
              fontSize={10}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={35}
              dy={10}
              tickFormatter={formatXAxis}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#8E8E93" 
              fontSize={12} 
              tickLine={false}
              domain={['auto', 'auto']}
              dx={-10}
              tickFormatter={(value) => 
                registerType === 'coil' || registerType === 'discrete' ? 
                value.toString() : value.toFixed(2)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                padding: "8px 12px",
              }}
              formatter={(value: number, name: string) => [
                registerType === 'coil' || registerType === 'discrete' ? 
                value.toString() : value.toFixed(2),
                `${title} (Address: ${data[0]?.address})`
              ]}
              labelFormatter={formatXAxis}
              labelStyle={{
                color: "#8E8E93",
                marginBottom: "4px",
              }}
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
      </div>
    </Card>
  );
}
