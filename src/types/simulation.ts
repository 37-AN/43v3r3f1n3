export interface ParameterRange {
  min: number;
  max: number;
}

export interface SimulationParameters {
  temperature: ParameterRange;
  pressure: ParameterRange;
  vibration: ParameterRange;
  production_rate: ParameterRange;
  downtime_minutes: ParameterRange;
  defect_rate: ParameterRange;
  energy_consumption: ParameterRange;
  machine_efficiency: ParameterRange;
}

export const defaultParameters: SimulationParameters = {
  temperature: { min: 20, max: 80 },
  pressure: { min: 0, max: 100 },
  vibration: { min: 0, max: 50 },
  production_rate: { min: 50, max: 200 },
  downtime_minutes: { min: 0, max: 60 },
  defect_rate: { min: 0, max: 5 },
  energy_consumption: { min: 50, max: 150 },
  machine_efficiency: { min: 70, max: 100 }
};