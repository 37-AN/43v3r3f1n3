import { Card } from "@/components/ui/card";
import { WriteHistoryEntry } from "@/types/simulation";

interface SimulationHistoryProps {
  writeHistory: WriteHistoryEntry[];
}

export function SimulationHistory({ writeHistory }: SimulationHistoryProps) {
  const getFormattedValue = (metric: string, value: number): string => {
    if (metric.toLowerCase().includes('temperature')) {
      return `${value.toFixed(1)}°C`;
    } else if (metric.toLowerCase().includes('pressure')) {
      return `${value.toFixed(2)} bar`;
    } else if (metric.toLowerCase().includes('vibration')) {
      return `${value.toFixed(2)} mm/s`;
    } else if (metric.toLowerCase().includes('efficiency')) {
      return `${value.toFixed(1)}%`;
    } else if (metric.toLowerCase().includes('energy')) {
      return `${value.toFixed(2)} kWh`;
    }
    return value.toFixed(2);
  };

  return (
    <Card className="p-4">
      <h4 className="text-md font-semibold mb-2">Simulation History</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {writeHistory.map((entry, index) => (
          <div 
            key={index}
            className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center"
          >
            <span className="text-sm font-medium">{entry.metric}</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {getFormattedValue(entry.metric, entry.value)}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}