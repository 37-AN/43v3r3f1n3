import { Card } from "@/components/ui/card";
import { useSimulationState } from "@/hooks/useSimulationState";
import { useSimulationData } from "@/hooks/useSimulationData";
import { SimulationCharts } from "./SimulationCharts";

export function SimulationDashboard() {
  const isSimulationRunning = useSimulationState();
  const chartData = useSimulationData(isSimulationRunning);

  if (!isSimulationRunning) {
    return (
      <Card className="p-4 glass-panel">
        <h2 className="text-lg font-semibold mb-2">Real-time Simulation Data</h2>
        <p className="text-sm text-muted-foreground text-center py-4">
          Start the simulation to see real-time data visualization
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 glass-panel">
      <h2 className="text-lg font-semibold mb-3">Real-time Simulation Data</h2>
      <SimulationCharts chartData={chartData} />
    </Card>
  );
}