import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OPC_UA_ENDPOINTS } from "@/config/opcuaConfig";

interface ConnectionStatusBadgesProps {
  connectionStatus: Record<string, boolean>;
}

export function ConnectionStatusBadges({ connectionStatus }: ConnectionStatusBadgesProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {Object.entries(connectionStatus).map(([server, status]) => (
          <Tooltip key={server}>
            <TooltipTrigger>
              <Badge 
                variant={status ? "default" : "destructive"}
                className="capitalize flex items-center gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                {server}: {status ? 'Connected' : 'Disconnected'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Endpoint: {OPC_UA_ENDPOINTS[server as keyof typeof OPC_UA_ENDPOINTS]}</p>
              <p className="text-xs text-muted-foreground">
                {status ? 'Receiving data' : 'Connection failed'}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}