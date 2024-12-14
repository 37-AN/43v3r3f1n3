import { IndustrialSimulationConfig, SimulationRange } from "@/types/industrialSimulation";
import { Machine, Product } from "./factoryConfig";

interface CorrelationRules {
  [key: string]: {
    dependencies: string[];
    calculate: (values: Record<string, number>) => number;
  };
}

export class IndustrialSimulationEngine {
  private config: IndustrialSimulationConfig;
  private currentValues: Record<string, number> = {};
  private correlationRules: CorrelationRules;
  private machines: Machine[] = [];
  private products: Product[] = [];

  constructor(
    config: IndustrialSimulationConfig,
    machines: Machine[] = [],
    products: Product[] = []
  ) {
    console.log('Initializing Industrial Simulation Engine');
    this.config = config;
    this.machines = machines;
    this.products = products;
    this.initializeCorrelationRules();
    this.initializeValues();
  }

  private initializeCorrelationRules() {
    this.correlationRules = {
      'production.efficiency': {
        dependencies: ['machine.maintenance_score', 'operator.shift_efficiency'],
        calculate: (values) => {
          return (values['machine.maintenance_score'] * 0.6 + values['operator.shift_efficiency'] * 0.4);
        }
      },
      'quality.defect_rate': {
        dependencies: ['machine.maintenance_score', 'environmental.temperature'],
        calculate: (values) => {
          const baseRate = 2.5;
          const maintenanceImpact = (100 - values['machine.maintenance_score']) * 0.05;
          const tempImpact = Math.abs(values['environmental.temperature'] - 23) * 0.1;
          return baseRate + maintenanceImpact + tempImpact;
        }
      },
      'machine.energy_consumption': {
        dependencies: ['production.throughput', 'environmental.temperature'],
        calculate: (values) => {
          const baseConsumption = 100;
          const throughputImpact = (values['production.throughput'] - 100) * 0.5;
          const tempImpact = (values['environmental.temperature'] - 20) * 2;
          return baseConsumption + throughputImpact + tempImpact;
        }
      }
    };
  }

  private initializeValues() {
    this.traverseConfig(this.config, '', (path, range) => {
      this.currentValues[path] = this.generateValue(range);
    });
    console.log('Initial values generated:', this.currentValues);
  }

  private traverseConfig(
    obj: any,
    path: string,
    callback: (path: string, range: SimulationRange) => void
  ) {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      if (value && typeof value === 'object' && 'min' in value && 'max' in value) {
        callback(newPath, value as SimulationRange);
      } else if (value && typeof value === 'object') {
        this.traverseConfig(value, newPath, callback);
      }
    }
  }

  private generateValue(range: SimulationRange): number {
    const value = range.min + Math.random() * (range.max - range.min);
    return Number(value.toFixed(2));
  }

  private applyCorrelations() {
    for (const [metric, rule] of Object.entries(this.correlationRules)) {
      const dependencyValues: Record<string, number> = {};
      rule.dependencies.forEach(dep => {
        dependencyValues[dep] = this.currentValues[dep];
      });
      this.currentValues[metric] = Number(rule.calculate(dependencyValues).toFixed(2));
    }
  }

  public getMachines(): Machine[] {
    return this.machines;
  }

  public getProducts(): Product[] {
    return this.products;
  }

  public addMachine(machine: Machine): void {
    console.log('Adding machine to simulation:', machine);
    this.machines.push(machine);
  }

  public addProduct(product: Product): void {
    console.log('Adding product to simulation:', product);
    this.products.push(product);
  }

  public generateNextValues(timeStep: number = 1): Record<string, number> {
    console.log(`Generating values for time step ${timeStep}`);
    
    // Update machine-specific metrics
    this.machines.forEach(machine => {
      const efficiency = machine.efficiency * (0.9 + Math.random() * 0.2); // ±10% variation
      this.currentValues[`machine.${machine.id}.efficiency`] = efficiency * 100;
      this.currentValues[`machine.${machine.id}.maintenance_score`] = 
        machine.maintenanceScore * (0.95 + Math.random() * 0.1); // ±5% variation
    });

    // Update product-specific metrics
    this.products.forEach(product => {
      this.currentValues[`product.${product.id}.cycle_time`] = 
        product.cycleTime * (0.9 + Math.random() * 0.2); // ±10% variation
      this.currentValues[`product.${product.id}.quality_score`] = 
        product.qualityThreshold * 100 * (0.95 + Math.random() * 0.1); // ±5% variation
    });

    // Update independent variables
    this.traverseConfig(this.config, '', (path, range) => {
      if (!this.correlationRules[path]) {
        const currentValue = this.currentValues[path];
        const maxChange = (range.max - range.min) * 0.1 * timeStep;
        const change = (Math.random() - 0.5) * maxChange;
        let newValue = currentValue + change;
        newValue = Math.max(range.min, Math.min(range.max, newValue));
        this.currentValues[path] = Number(newValue.toFixed(2));
      }
    });

    // Apply correlations
    this.applyCorrelations();

    console.log('Generated values:', this.currentValues);
    return { ...this.currentValues };
  }

  public injectAnomaly(metric: string, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    console.log(`Injecting ${severity} anomaly for metric: ${metric}`);
    
    const path = metric.split('.');
    let config = this.config as any;
    for (const key of path) {
      config = config[key];
    }

    if (!config || !('min' in config) || !('max' in config)) {
      console.error(`Invalid metric path: ${metric}`);
      return;
    }

    const range = config as SimulationRange;
    const severityFactors = {
      low: 0.2,
      medium: 0.5,
      high: 1.0
    };

    const anomalyValue = Math.random() > 0.5 ?
      range.max + (range.max - range.min) * severityFactors[severity] :
      range.min - (range.max - range.min) * severityFactors[severity];

    this.currentValues[metric] = Number(anomalyValue.toFixed(2));
    console.log(`Anomaly injected: ${metric} = ${anomalyValue}`);
  }
}
