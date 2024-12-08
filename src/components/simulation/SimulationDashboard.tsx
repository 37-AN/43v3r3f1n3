import { Card } from "@/components/ui/card";
import { useSimulationState } from "@/hooks/useSimulationState";
import { useSimulationData } from "@/hooks/useSimulationData";
import { SimulationCharts } from "./SimulationCharts";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { SimulationConfig } from "./SimulationConfig";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function SimulationDashboard() {
  const isSimulationRunning = useSimulationState();
  const chartData = useSimulationData(isSimulationRunning);
  const [showConfig, setShowConfig] = useState(false);

  return (
    <Card className="p-3 glass-panel">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`status-indicator ${isSimulationRunning ? 'active' : 'error'}`} />
          <h2 className="text-sm font-medium">
            Simulation {isSimulationRunning ? 'Running' : 'Stopped'}
          </h2>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7">
              <Settings2 className="h-4 w-4 mr-1" />
              Configure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <SimulationConfig />
          </DialogContent>
        </Dialog>
      </div>

      {isSimulationRunning && (
        <div className="mt-2">
          <SimulationCharts chartData={chartData} />
        </div>
      )}
    </Card>
  );
}