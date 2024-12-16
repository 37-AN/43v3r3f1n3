import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMESData } from "@/hooks/useMESData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatXAxis, getRegisterColor } from "@/utils/chart/formatters";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MESDataDisplayProps {
  deviceId: string;
}

export const MESDataDisplay = ({ deviceId }: MESDataDisplayProps) => {
  const { mesMetrics, tokenizedAssets, refinedData, isLoading, error } = useMESData(deviceId);

  console.log('MES Data:', { mesMetrics, tokenizedAssets, refinedData, isLoading, error });

  const getMetricDisplayName = (metricType: string) => {
    const metricMap: Record<string, string> = {
      'motor_speed': 'Motor Speed (RPM)',
      'oil_pressure': 'Oil Pressure (PSI)',
      'bearing_temperature': 'Bearing Temperature (°F)',
      'vibration': 'Vibration (mm/s)',
      'current_draw': 'Current Draw (A)',
      'power_factor': 'Power Factor (PF)'
    };
    return metricMap[metricType] || metricType;
  };

  if (error instanceof Error) {
    toast.error(error.message);
    return (
      <Card className="p-4">
        <div className="text-red-500">Error loading MES data: {error.message}</div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm text-gray-500">Loading MES data...</p>
        </div>
      </Card>
    );
  }

  if (!mesMetrics?.length && !tokenizedAssets?.length && !refinedData?.length) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          No MES data available for this device
        </div>
      </Card>
    );
  }

  // Format refined data for the chart
  const formattedRefinedData = refinedData?.map(item => ({
    timestamp: item.timestamp,
    value: typeof item.value === 'number' ? item.value : parseFloat(item.value),
    quality_score: item.quality_score
  })) || [];

  console.log('Formatted refined data:', formattedRefinedData);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Refined MES Metrics</h3>
        {formattedRefinedData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedRefinedData}>
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
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No refined data available</p>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">MES Metrics</h3>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {mesMetrics && mesMetrics.length > 0 ? (
              mesMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="p-2 bg-gray-50 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{getMetricDisplayName(metric.metric_type)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(metric.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">
                      {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value} {metric.unit}
                    </p>
                    <Badge 
                      variant={
                        metric.metadata?.quality_score >= 0.8 
                          ? "success" 
                          : "warning"
                      }
                    >
                      Quality: {((metric.metadata?.quality_score || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No MES metrics available</p>
            )}
          </div>
        </ScrollArea>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Tokenized Assets</h3>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {tokenizedAssets && tokenizedAssets.length > 0 ? (
              tokenizedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{asset.name}</p>
                    <Badge>{asset.token_symbol}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Supply: {asset.total_supply.toLocaleString()}</p>
                    <p>Price: ${asset.price_per_token}</p>
                    <p className="mt-1 text-xs">
                      Created: {new Date(asset.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No tokenized assets found
              </p>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};