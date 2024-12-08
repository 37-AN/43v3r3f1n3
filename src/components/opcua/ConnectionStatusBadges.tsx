import { Badge } from "@/components/ui/badge";

interface ConnectionStatusBadgesProps {
  connectionStatus: Record<string, boolean>;
}

export function ConnectionStatusBadges({ connectionStatus }: ConnectionStatusBadgesProps) {
  return (
    <div className="flex gap-2">
      {Object.entries(connectionStatus).map(([server, status]) => (
        <Badge 
          key={server}
          variant={status ? "default" : "destructive"}
          className="capitalize"
        >
          {server}: {status ? 'Connected' : 'Disconnected'}
        </Badge>
      ))}
    </div>
  );
}