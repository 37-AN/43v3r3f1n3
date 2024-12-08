import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface InsightMessageProps {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
  created_at: string;
  metadata: Record<string, any>;
}

export function InsightMessage({ message, severity, confidence, created_at, metadata }: InsightMessageProps) {
  const getSeverityIcon = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      {getSeverityIcon(severity)}
      <div>
        <p className="text-sm font-medium">{message}</p>
        <div className="flex gap-4 mt-1">
          <p className="text-xs text-gray-500">
            Confidence: {(confidence * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">
            {new Date(created_at).toLocaleTimeString()}
          </p>
          {metadata?.type && (
            <p className="text-xs text-gray-500 capitalize">
              Type: {metadata.type}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}