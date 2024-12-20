import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface MESMetricsListProps {
  metrics: any[];
  getMetricDisplayName: (type: string) => string;
}

export const MESMetricsList = ({ metrics, getMetricDisplayName }: MESMetricsListProps) => {
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {metrics && metrics.length > 0 ? (
          metrics.map((metric) => (
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
  );
};