import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface StatusItemProps {
  title: string;
  isConnected: boolean;
  lastUpdate?: Date;
}

export function StatusItem({ title, isConnected, lastUpdate }: StatusItemProps) {
  return (
    <div className="flex items-center gap-3">
      {isConnected ? (
        <CheckCircle2 className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500" />
      )}
      <div>
        <p className="font-medium">{title}</p>
        <Badge variant={isConnected ? "success" : "destructive"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
        {lastUpdate && (
          <p className="text-xs text-gray-500 mt-1">
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}