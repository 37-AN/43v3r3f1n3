import { Card } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  status?: string;
  showTrend?: boolean;
}

export function MetricCard({ title, value, change, status, showTrend = true }: MetricCardProps) {
  return (
    <Card className="p-4 glass-panel hover:shadow-lg transition-shadow duration-200">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-2xl font-bold">{value}</span>
        {showTrend && change !== undefined && (
          <div className={`flex items-center ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
            <span className="ml-1 text-sm">
              {status || `${Math.abs(change).toFixed(1)}%`}
            </span>
          </div>
        )}
      </div>
      {status && (
        <div className="mt-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            status === 'Optimal' ? 'bg-green-100 text-green-800' :
            status === 'Good' ? 'bg-blue-100 text-blue-800' :
            status === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status}
          </span>
        </div>
      )}
    </Card>
  );
}