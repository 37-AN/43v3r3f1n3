import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface MetricsChartProps {
  title: string;
  data: Array<{
    timestamp: string;
    value: number;
  }>;
  className?: string;
}

export function MetricsChart({ title, data, className }: MetricsChartProps) {
  return (
    <Card className={cn("p-6 animate-fade-up glass-panel h-[400px]", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-system-gray-900">{title}</h3>
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
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, title]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#34C759"
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