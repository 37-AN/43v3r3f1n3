import { Card } from "@/components/ui/card";
import { useSimulationState } from "@/hooks/useSimulationState";
import { useSimulationData } from "@/hooks/useSimulationData";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SimulationConfig } from "./SimulationConfig";
import { WriteHistory } from "./WriteHistory";
import { defaultSimulationConfig } from "@/types/industrialSimulation";
import { IndustrialSimulationEngine } from "@/utils/industrial/simulationEngine";
import { useState } from "react";

interface SimulationDashboardProps {
  deviceId: string;
}

export function SimulationDashboard({ deviceId }: SimulationDashboardProps) {
  const { simulationState } = useSimulationState();
  const [simulationEngine] = useState(() => new IndustrialSimulationEngine(defaultSimulationConfig));
  const { writeHistory } = useSimulationData(simulationState.isRunning, deviceId, simulationEngine);

  if (!deviceId) {
    return (
      <Card className="p-3 glass-panel">
        <div className="text-center p-4">
          No device selected
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 glass-panel">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`status-indicator ${simulationState.isRunning ? 'active' : 'error'}`} />
          <h2 className="text-sm font-medium">
            Simulation {simulationState.isRunning ? 'Running' : 'Stopped'}
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
            <SimulationConfig deviceId={deviceId} />
          </DialogContent>
        </Dialog>
      </div>

      {simulationState.isRunning && (
        <WriteHistory history={writeHistory} />
      )}
    </Card>
  );
}