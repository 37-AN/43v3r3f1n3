import React from 'react';
import { PLCData } from '@/utils/plcData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IndexProps {
  plcData: PLCData | null;
  connectionStatus: { [key: string]: boolean };
}

const Index: React.FC<IndexProps> = ({ plcData, connectionStatus }) => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">PLC Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="space-y-3">
            {Object.entries(connectionStatus).map(([deviceId, status]) => (
              <div key={deviceId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">PLCSIM Device ({deviceId})</span>
                <Badge variant={status ? "success" : "destructive"} className="capitalize">
                  {status ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">PLC Data</h2>
          <ScrollArea className="h-[300px] pr-4">
            {plcData ? (
              <div className="space-y-3">
                {Object.entries(plcData).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{key}</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {value?.toString() ?? 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Waiting for PLC data...
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default Index;