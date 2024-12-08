import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

interface SourceCardProps {
  id: string;
  name: string;
  connected: boolean;
  lastUpdate: Date | null;
  onConfigure: () => void;
}

export const SourceCard = ({ id, name, connected, lastUpdate, onConfigure }: SourceCardProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        <div>
          <h3 className="text-sm font-medium">{name}</h3>
          <p className="text-xs text-gray-500">
            {lastUpdate 
              ? `Last update: ${lastUpdate.toLocaleTimeString()}`
              : 'No data received yet'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={connected ? "success" : "destructive"} className="text-xs">
          {connected ? 'Connected' : 'Disconnected'}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onConfigure}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};