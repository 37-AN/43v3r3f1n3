import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConsoleMessage = {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
};

interface ConsoleProps {
  messages: ConsoleMessage[];
  className?: string;
}

export const Console = ({ messages, className }: ConsoleProps) => {
  const getIcon = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Card className={cn("bg-slate-950", className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">System Console</span>
        </div>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="p-4 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-2 text-sm text-slate-300 p-2 rounded bg-slate-900"
            >
              {getIcon(msg.type)}
              <div className="flex-1 min-w-0">
                <p className="break-words">{msg.message}</p>
                <span className="text-xs text-slate-500">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-4">
              No messages to display
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};