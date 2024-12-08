import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMESData } from "@/hooks/useMESData";

interface MESDataDisplayProps {
  deviceId: string;
}

export const MESDataDisplay = ({ deviceId }: MESDataDisplayProps) => {
  const { mesMetrics, tokenizedAssets, isLoading } = useMESData(deviceId);

  if (isLoading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500">Loading MES data...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">MES Metrics</h3>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {mesMetrics?.map((metric) => (
              <div
                key={metric.id}
                className="p-2 bg-gray-50 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{metric.metric_type}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(metric.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono">
                    {metric.value.toFixed(2)} {metric.unit}
                  </p>
                  <Badge variant={metric.metadata.quality_score >= 0.8 ? "success" : "warning"}>
                    Quality: {(metric.metadata.quality_score * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Tokenized Assets</h3>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {tokenizedAssets?.map((asset) => (
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
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};