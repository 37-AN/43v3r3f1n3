import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useSystemStatus } from "@/hooks/useSystemStatus";

export function ConnectionStatusBanner() {
  const { refineryStatus, mesStatus } = useSystemStatus();

  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {refineryStatus.isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <div>
            <p className="font-medium">AI Industry Refinery</p>
            <Badge variant={refineryStatus.isConnected ? "success" : "destructive"}>
              {refineryStatus.isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mesStatus.isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <div>
            <p className="font-medium">Tokenized MES Engine</p>
            <Badge variant={mesStatus.isConnected ? "success" : "destructive"}>
              {mesStatus.isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}