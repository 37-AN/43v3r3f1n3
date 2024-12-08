import { Card } from "@/components/ui/card";
import { useSimulationState } from "@/hooks/useSimulationState";
import { useSimulationData } from "@/hooks/useSimulationData";
import { SimulationCharts } from "./SimulationCharts";

export function SimulationDashboard() {
  const isSimulationRunning = useSimulationState();
  const chartData = useSimulationData(isSimulationRunning);

  if (!isSimulationRunning) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Real-time Simulation Data</h2>
        <p className="text-muted-foreground text-center py-8">
          Start the simulation to see real-time data visualization
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Real-time Simulation Data</h2>
      <SimulationCharts chartData={chartData} />
    </Card>
  );
}