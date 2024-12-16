import { Metric, Analysis } from './types.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function getDefaultUnit(metricType: string): string {
  const unitMap: Record<string, string> = {
    temperature: '°C',
    pressure: 'bar',
    vibration: 'mm/s',
    production_rate: 'units/hr',
    downtime_minutes: 'min',
    defect_rate: '%',
    energy_consumption: 'kWh',
    machine_efficiency: '%'
  };
  return unitMap[metricType] || 'unit';
}

export function generateAnalysis(metrics: Metric[]): Analysis {
  if (!metrics || metrics.length === 0) {
    return {
      message: "No data available for analysis",
      severity: "info",
      confidence: 0.5
    };
  }

  const values = metrics.map(m => m.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  let message = `Analyzed ${metrics.length} metrics. Average value: ${avg.toFixed(2)}`;
  let severity = "info";
  let confidence = 0.85;

  if (max > avg * 2) {
    message += `. Detected unusually high values (max: ${max.toFixed(2)})`;
    severity = "warning";
    confidence = 0.9;
  } else if (min < avg * 0.5) {
    message += `. Detected unusually low values (min: ${min.toFixed(2)})`;
    severity = "warning";
    confidence = 0.9;
  }

  return { message, severity, confidence };
}