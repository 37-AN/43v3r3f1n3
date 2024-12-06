import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WriteHistoryEntry {
  timestamp: string;
  address: number;
  value: number;
}

interface WriteHistoryProps {
  history: WriteHistoryEntry[];
}

export function WriteHistory({ history }: WriteHistoryProps) {
  return (
    <Card className="p-4 mt-4 animate-fade-up glass-panel">
      <h4 className="text-lg font-semibold text-system-gray-900 mb-2">Write History</h4>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No writes yet</p>
          ) : (
            history.map((entry, index) => (
              <div
                key={index}
                className="text-sm border-b border-border/50 last:border-0 pb-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Address: {entry.address} → Value: {entry.value}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}