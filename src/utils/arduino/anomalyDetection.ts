import { ArduinoPLCDataPoint } from './types';
import { toast } from "sonner";

export const detectArduinoAnomalies = (
  data: ArduinoPLCDataPoint[]
): ArduinoPLCDataPoint[] => {
  console.log("Detecting anomalies using advanced statistical methods:", data);
  
  if (data.length < 2) {
    console.log("Not enough data points for anomaly detection");
    return [];
  }

  try {
    const dataByType = data.reduce((acc, point) => {
      if (!acc[point.data_type]) {
        acc[point.data_type] = [];
      }
      acc[point.data_type].push(point.value);
      return acc;
    }, {} as Record<string, number[]>);

    const anomalies: ArduinoPLCDataPoint[] = [];

    Object.entries(dataByType).forEach(([dataType, values]) => {
      const alpha = 0.15;
      let ewma = values[0];
      let ewmvar = 0;
      
      values.forEach((value, i) => {
        if (i > 0) {
          ewma = alpha * value + (1 - alpha) * ewma;
          ewmvar = alpha * Math.pow(value - ewma, 2) + (1 - alpha) * ewmvar;
        }
      });

      const stdDev = Math.sqrt(ewmvar);
      const threshold = 2.5 * stdDev;

      data.forEach(point => {
        if (
          point.data_type === dataType &&
          Math.abs(point.value - ewma) > threshold
        ) {
          anomalies.push(point);
        }
      });
    });

    console.log("Detected anomalies:", anomalies);
    return anomalies;
  } catch (error) {
    console.error("Error in anomaly detection:", error);
    toast.error("Error detecting anomalies in Arduino data");
    return [];
  }
};