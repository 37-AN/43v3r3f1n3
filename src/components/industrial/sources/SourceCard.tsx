import { Badge } from "@/components/ui/badge";

interface SourceCardProps {
  id: string;
  name: string;
  connected: boolean;
  lastUpdate: Date | null;
}

export const SourceCard = ({ id, name, connected, lastUpdate }: SourceCardProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-gray-500">
            {lastUpdate 
              ? `Last update: ${lastUpdate.toLocaleTimeString()}`
              : 'No data received yet'}
          </p>
        </div>
      </div>
      <Badge variant={connected ? "success" : "destructive"}>
        {connected ? 'Connected' : 'Disconnected'}
      </Badge>
    </div>
  );
};