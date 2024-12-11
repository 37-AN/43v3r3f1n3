import { Card } from "@/components/ui/card";
import { WriteHistoryEntry } from "@/types/simulation";

interface SimulationHistoryProps {
  writeHistory: WriteHistoryEntry[];
}

export function SimulationHistory({ writeHistory }: SimulationHistoryProps) {
  const getMetricDisplayName = (metric: string) => {
    const metricMap: Record<string, string> = {
      'motor_speed': 'Motor Speed (RPM)',
      'oil_pressure': 'Oil Pressure (PSI)',
      'bearing_temperature': 'Bearing Temperature (°F)',
      'vibration': 'Vibration (mm/s)',
      'current_draw': 'Current Draw (A)',
      'power_factor': 'Power Factor (PF)'
    };
    return metricMap[metric] || metric;
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
            <span className="text-sm font-medium">{getMetricDisplayName(entry.metric)}</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {entry.value.toFixed(2)}
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