import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PLCData } from "@/utils/plcData";

interface RealTimeDataProps {
  simulatedData: Record<string, number>;
  plcData: PLCData | null;
}

export const RealTimeData = ({ simulatedData, plcData }: RealTimeDataProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Real-time Data</h2>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-3">
          {Object.entries(simulatedData).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium capitalize">{key}</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {value.toFixed(2)}
              </span>
            </div>
          ))}
          {plcData && Object.entries(plcData).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">{key}</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {value !== undefined && value !== null ? String(value) : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};