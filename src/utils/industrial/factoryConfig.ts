import { IndustrialSimulationConfig } from "@/types/industrialSimulation";

export interface Machine {
  id: string;
  name: string;
  type: 'assembly' | 'packaging' | 'testing' | 'processing';
  capacity: number;
  efficiency: number;
  maintenanceScore: number;
}

export interface Product {
  id: string;
  name: string;
  cycleTime: number;
  qualityThreshold: number;
  requiredMachines: string[];
}

export const createMachine = (
  name: string,
  type: Machine['type'],
  capacity: number = 100,
  efficiency: number = 0.85,
  maintenanceScore: number = 90
): Machine => {
  console.log(`Creating machine: ${name} of type ${type}`);
  return {
    id: crypto.randomUUID(),
    name,
    type,
    capacity,
    efficiency,
    maintenanceScore
  };
};

export const createProduct = (
  name: string,
  cycleTime: number,
  qualityThreshold: number = 0.95,
  requiredMachines: string[] = []
): Product => {
  console.log(`Creating product: ${name} with cycle time ${cycleTime}`);
  return {
    id: crypto.randomUUID(),
    name,
    cycleTime,
    qualityThreshold,
    requiredMachines
  };
};

export const generateSimulationConfig = (
  machines: Machine[],
  products: Product[]
): IndustrialSimulationConfig => {
  console.log('Generating simulation config for:', { machines, products });
  
  // Calculate average efficiency and maintenance scores
  const avgEfficiency = machines.reduce((sum, m) => sum + m.efficiency, 0) / machines.length;
  const avgMaintenance = machines.reduce((sum, m) => sum + m.maintenanceScore, 0) / machines.length;
  
  // Calculate total capacity
  const totalCapacity = machines.reduce((sum, m) => sum + m.capacity, 0);
  
  // Calculate average cycle time
  const avgCycleTime = products.reduce((sum, p) => sum + p.cycleTime, 0) / products.length;

  return {
    production: {
      throughput: { min: totalCapacity * 0.7, max: totalCapacity },
      cycle_time: { min: avgCycleTime * 0.8, max: avgCycleTime * 1.2 },
      efficiency: { min: avgEfficiency * 0.8 * 100, max: avgEfficiency * 1.1 * 100 }
    },
    machine: {
      energy_consumption: { min: 50, max: 150 },
      vibration: { min: 0.1, max: 5.0 },
      maintenance_score: { min: avgMaintenance * 0.8, max: avgMaintenance }
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
};

// Example usage:
// const machines = [
//   createMachine('Assembly Line 1', 'assembly', 100),
//   createMachine('Packaging Unit 1', 'packaging', 80),
// ];
// 
// const products = [
//   createProduct('Widget A', 45),
//   createProduct('Widget B', 60),
// ];
// 
// const config = generateSimulationConfig(machines, products);