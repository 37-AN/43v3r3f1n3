import { IndustrialSimulationConfig, SimulationRange } from "@/types/industrialSimulation";
import { Machine, Product } from "./factoryConfig";
import { format } from "date-fns";

interface SimulatedDataPoint {
  timestamp: string;
  source: string;
  temperature_C: number;
  pressure_bar: number;
  flow_rate_m3_s: number;
  machine_state: 'idle' | 'running' | 'fault';
  energy_consumption_kWh: number;
  metadata: {
    units: {
      temperature_C: string;
      pressure_bar: string;
      flow_rate_m3_s: string;
      energy_consumption_kWh: string;
    };
    source_id: string;
    quality_score: number;
    error_state?: string;
  };
}

export class IndustrialSimulationEngine {
  private config: IndustrialSimulationConfig;
  private currentValues: Record<string, number> = {};
  private machines: Machine[] = [];
  private products: Product[] = [];
  private lastUpdate: Date = new Date();
  private errorFrequency: number = 0.05; // 5% chance of error
  private seed: number;
  private anomalyState: Record<string, { active: boolean; severity: string }> = {};

  constructor(
    config: IndustrialSimulationConfig,
    machines: Machine[] = [],
    products: Product[] = [],
    seed?: number
  ) {
    console.log('Initializing Industrial Simulation Engine');
    this.config = config;
    this.machines = machines;
    this.products = products;
    this.seed = seed || Date.now();
    this.initializeValues();
  }

  private seededRandom(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  private initializeValues() {
    this.currentValues = {
      temperature_C: 70 + this.seededRandom() * 10,
      pressure_bar: 3 + this.seededRandom() * 0.5,
      flow_rate_m3_s: 10 + this.seededRandom() * 5,
      energy_consumption_kWh: 10 + this.seededRandom() * 10
    };
    console.log('Initial values generated:', this.currentValues);
  }

  public injectAnomaly(metric: string, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    console.log(`Injecting ${severity} anomaly for metric: ${metric}`);
    this.anomalyState[metric] = { active: true, severity };
  }

  public generateNextValues(): Record<string, number> {
    const diurnalFactor = this.getDiurnalFactor();
    const values: Record<string, number> = {};

    Object.keys(this.currentValues).forEach(key => {
      let baseValue = this.currentValues[key];
      
      // Apply anomaly if active
      if (this.anomalyState[key]?.active) {
        const severityMultiplier = {
          low: 1.5,
          medium: 2,
          high: 3
        }[this.anomalyState[key].severity] || 1;
        
        baseValue *= severityMultiplier;
      }

      // Add random variation
      values[key] = baseValue + (this.seededRandom() - 0.5) * 2 * diurnalFactor;
    });

    // Update current values for next iteration
    this.currentValues = values;
    return values;
  }

  private getDiurnalFactor(): number {
    const hour = new Date().getHours();
    // Simulate higher values during working hours (8am-6pm)
    return hour >= 8 && hour <= 18 ? 1.2 : 0.8;
  }

  public generateDataPoint(sourceId: string = 'PLCIoT_01'): SimulatedDataPoint {
    const diurnalFactor = this.getDiurnalFactor();
    const { hasError, errorType } = this.simulateError();
    
    // Update values with realistic variations
    this.currentValues.temperature_C += (this.seededRandom() - 0.5) * 2 * diurnalFactor;
    this.currentValues.pressure_bar += (this.seededRandom() - 0.5) * 0.1 * diurnalFactor;
    this.currentValues.flow_rate_m3_s += (this.seededRandom() - 0.5) * 0.5 * diurnalFactor;
    this.currentValues.energy_consumption_kWh += (this.seededRandom() - 0.5) * 2 * diurnalFactor;

    // Determine machine state
    let machineState: 'idle' | 'running' | 'fault' = 'running';
    if (hasError) {
      machineState = 'fault';
    } else if (this.seededRandom() < 0.1) {
      machineState = 'idle';
    }

    const dataPoint: SimulatedDataPoint = {
      timestamp: new Date().toISOString(),
      source: sourceId,
      temperature_C: Number(this.currentValues.temperature_C.toFixed(1)),
      pressure_bar: Number(this.currentValues.pressure_bar.toFixed(2)),
      flow_rate_m3_s: Number(this.currentValues.flow_rate_m3_s.toFixed(1)),
      machine_state: machineState,
      energy_consumption_kWh: Number(this.currentValues.energy_consumption_kWh.toFixed(1)),
      metadata: {
        units: {
          temperature_C: "°C",
          pressure_bar: "bar",
          flow_rate_m3_s: "m³/s",
          energy_consumption_kWh: "kWh"
        },
        source_id: sourceId,
        quality_score: hasError ? 0.5 : 0.95
      }
    };

    if (hasError) {
      dataPoint.metadata.error_state = errorType;
    }

    console.log('Generated data point:', dataPoint);
    return dataPoint;
  }

  private simulateError(): { hasError: boolean; errorType?: string } {
    if (this.seededRandom() < this.errorFrequency) {
      const errorTypes = [
        'sensor_disconnected',
        'value_out_of_range',
        'communication_error',
        'calibration_error'
      ];
      return {
        hasError: true,
        errorType: errorTypes[Math.floor(this.seededRandom() * errorTypes.length)]
      };
    }
    return { hasError: false };
  }

  public setErrorFrequency(frequency: number) {
    this.errorFrequency = Math.max(0, Math.min(1, frequency));
    console.log(`Error frequency set to ${this.errorFrequency * 100}%`);
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
}