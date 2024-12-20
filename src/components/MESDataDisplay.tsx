import { Card } from "@/components/ui/card";
import { useMESData } from "@/hooks/useMESData";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MESMetricsDisplay } from "./mes/MESMetricsDisplay";
import { MESMetricsList } from "./mes/MESMetricsList";
import { TokenizedAssetsList } from "./mes/TokenizedAssetsList";

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
      'power_factor': 'Power Factor (PF)',
      'production.throughput': 'Production Throughput',
      'production.efficiency': 'Production Efficiency',
      'machine.vibration': 'Machine Vibration',
      'quality.defect_rate': 'Quality Defect Rate'
    };
    return metricMap[metricType] || metricType.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
    timestamp: new Date(item.timestamp).getTime(),
    value: typeof item.value === 'number' ? item.value : parseFloat(item.value),
    quality_score: item.quality_score || 0,
    metric_type: item.data_type
  })) || [];

  // Group data by metric type
  const groupedData = formattedRefinedData.reduce((acc, item) => {
    if (!acc[item.metric_type]) {
      acc[item.metric_type] = [];
    }
    acc[item.metric_type].push(item);
    return acc;
  }, {} as Record<string, typeof formattedRefinedData>);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Refined MES Metrics</h3>
        {Object.entries(groupedData).map(([metricType, data]) => (
          <MESMetricsDisplay
            key={metricType}
            metricType={metricType}
            data={data}
            getMetricDisplayName={getMetricDisplayName}
          />
        ))}
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">MES Metrics</h3>
        <MESMetricsList 
          metrics={mesMetrics || []}
          getMetricDisplayName={getMetricDisplayName}
        />
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Tokenized Assets</h3>
        <TokenizedAssetsList assets={tokenizedAssets || []} />
      </Card>
    </div>
  );
};