import { Card } from "@/components/ui/card";
import { SimulationControls } from "@/features/simulation/components/SimulationControls";
import { SimulationMetricSelect } from "./SimulationMetricSelect";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Factory, Package } from "lucide-react";
import { createMachine, createProduct } from "@/utils/industrial/factoryConfig";

interface SimulationPanelProps {
  isRunning: boolean;
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
  onToggleSimulation: () => void;
  onInjectAnomaly: () => void;
}

export function SimulationPanel({
  isRunning,
  selectedMetric,
  onMetricChange,
  onToggleSimulation,
  onInjectAnomaly
}: SimulationPanelProps) {
  const handleInjectAnomaly = () => {
    if (!selectedMetric) {
      toast.error('Please select a metric first');
      return;
    }
    onInjectAnomaly();
  };

  const handleCreateMachine = () => {
    try {
      const newMachine = createMachine(
        `Assembly Line ${Math.floor(Math.random() * 1000)}`,
        'assembly',
        100,
        0.85,
        90
      );
      console.log('Created new machine:', newMachine);
      toast.success('New machine created successfully');
    } catch (error) {
      console.error('Error creating machine:', error);
      toast.error('Failed to create machine');
    }
  };

  const handleCreateProduct = () => {
    try {
      const newProduct = createProduct(
        `Widget ${Math.floor(Math.random() * 1000)}`,
        45,
        0.95
      );
      console.log('Created new product:', newProduct);
      toast.success('New product created successfully');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    }
  };

  return (
    <Card className="p-6 animate-fade-up glass-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-system-gray-900">
          Industrial Simulation Control
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCreateMachine}
            className="flex items-center gap-2"
          >
            <Factory className="h-4 w-4" />
            Create Machine
          </Button>
          <Button
            variant="outline"
            onClick={handleCreateProduct}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Create Product
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <SimulationControls 
          isRunning={isRunning}
          selectedMetric={selectedMetric}
          onToggleSimulation={onToggleSimulation}
          onInjectAnomaly={handleInjectAnomaly}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <SimulationMetricSelect
          selectedMetric={selectedMetric}
          onMetricChange={onMetricChange}
        />
      </div>
    </Card>
  );
}