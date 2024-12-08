import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { ChartHeader } from "./charts/ChartHeader";
import { ChartTooltipContent } from "./charts/ChartTooltipContent";
import { formatXAxis, getRegisterColor } from "@/utils/chart/formatters";

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
  const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : undefined;
  const address = data.length > 0 ? data[0].address : 0;

  return (
    <Card className={cn(
      "w-full p-3",
      "bg-white/80 dark:bg-system-gray-800/80 backdrop-blur-lg",
      "border border-white/20 dark:border-system-gray-700/20",
      "shadow-lg",
      className
    )}>
      <ChartHeader 
        title={title}
        registerType={registerType}
        lastTimestamp={lastTimestamp}
      />
      
      <div className="h-[200px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E5E5" 
              className="opacity-30"
            />
            <XAxis
              dataKey="timestamp"
              stroke="#8E8E93"
              fontSize={8}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={50}
              dy={20}
              tickFormatter={formatXAxis}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#8E8E93" 
              fontSize={10}
              tickLine={false}
              domain={['auto', 'auto']}
              dx={-5}
              tickFormatter={(value) => 
                registerType === 'coil' || registerType === 'discrete' ? 
                value.toString() : value.toFixed(1)
              }
            />
            <Tooltip
              content={
                <ChartTooltipContent 
                  title={title}
                  address={address}
                  registerType={registerType}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={getRegisterColor(registerType)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={true}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}