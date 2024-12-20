import { Badge } from "@/components/ui/badge";
import { formatXAxis, getRegisterColor } from "@/utils/chart/formatters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MESMetricsDisplayProps {
  metricType: string;
  data: any[];
  getMetricDisplayName: (type: string) => string;
}

export const MESMetricsDisplay = ({ metricType, data, getMetricDisplayName }: MESMetricsDisplayProps) => {
  return (
    <div key={metricType} className="mb-6">
      <h4 className="text-md font-medium mb-2">{getMetricDisplayName(metricType)}</h4>
      <div className="h-[200px] w-full">
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
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const value = payload[0].value;
                  const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
                  return (
                    <div className="bg-white/95 border-none rounded-lg shadow-lg p-3">
                      <p className="text-gray-500 mb-1">{formatXAxis(payload[0].payload.timestamp)}</p>
                      <p className="font-medium">Value: {formattedValue}</p>
                      <p className="text-sm">Quality: {(payload[0].payload.quality_score * 100).toFixed(0)}%</p>
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
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};