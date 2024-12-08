export interface SimulationRange {
  min: number;
  max: number;
}

export interface ProductionMetrics {
  throughput: SimulationRange;
  cycle_time: SimulationRange;
  efficiency: SimulationRange;
}

export interface MachinePerformance {
  energy_consumption: SimulationRange;
  vibration: SimulationRange;
  maintenance_score: SimulationRange;
}

export interface QualityControl {
  defect_rate: SimulationRange;
  inspection_pass_rate: SimulationRange;
  scrap_percentage: SimulationRange;
}

export interface InventoryMetrics {
  raw_material_level: SimulationRange;
  stock_level: SimulationRange;
  reorder_point: SimulationRange;
}

export interface OperatorMetrics {
  shift_efficiency: SimulationRange;
  override_count: SimulationRange;
  error_rate: SimulationRange;
}

export interface EnvironmentalConditions {
  temperature: SimulationRange;
  humidity: SimulationRange;
  pressure: SimulationRange;
}

export interface IndustrialSimulationConfig {
  production: ProductionMetrics;
  machine: MachinePerformance;
  quality: QualityControl;
  inventory: InventoryMetrics;
  operator: OperatorMetrics;
  environmental: EnvironmentalConditions;
}

export const defaultSimulationConfig: IndustrialSimulationConfig = {
  production: {
    throughput: { min: 80, max: 120 },
    cycle_time: { min: 45, max: 75 },
    efficiency: { min: 75, max: 95 }
  },
  machine: {
    energy_consumption: { min: 50, max: 150 },
    vibration: { min: 0.1, max: 5.0 },
    maintenance_score: { min: 70, max: 100 }
  },
  quality: {
    defect_rate: { min: 0, max: 5 },
    inspection_pass_rate: { min: 90, max: 100 },
    scrap_percentage: { min: 0, max: 3 }
  },
  inventory: {
    raw_material_level: { min: 40, max: 100 },
    stock_level: { min: 50, max: 100 },
    reorder_point: { min: 20, max: 40 }
  },
  operator: {
    shift_efficiency: { min: 80, max: 100 },
    override_count: { min: 0, max: 10 },
    error_rate: { min: 0, max: 5 }
  },
  environmental: {
    temperature: { min: 18, max: 28 },
    humidity: { min: 30, max: 70 },
    pressure: { min: 980, max: 1020 }
  }
};