import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info, Terminal, ChevronUp, ChevronDown } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      default:
        return <Info className="w-3 h-3 text-blue-500" />;
    }
  };

  return (
    <Card className={cn("bg-slate-950 transition-all duration-200", className)}>
      <div 
        className="flex items-center justify-between px-3 py-1 border-b border-slate-800 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-slate-400" />
          <span className="text-xs font-medium text-slate-200">Console</span>
        </div>
        {isExpanded ? 
          <ChevronDown className="w-4 h-4 text-slate-400" /> : 
          <ChevronUp className="w-4 h-4 text-slate-400" />
        }
      </div>
      {isExpanded && (
        <ScrollArea className="h-[120px]">
          <div className="p-2 space-y-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-2 text-xs text-slate-300 p-1 rounded bg-slate-900"
              >
                {getIcon(msg.type)}
                <div className="flex-1 min-w-0">
                  <p className="break-words">{msg.message}</p>
                  <span className="text-[10px] text-slate-500">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-slate-500 py-2 text-xs">
                No messages to display
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};