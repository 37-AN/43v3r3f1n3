import { ArduinoPLCDataPoint } from './types';

export const reduceArduinoNoise = (
  data: ArduinoPLCDataPoint[],
  processNoise: number = 0.1,
  measurementNoise: number = 1
): ArduinoPLCDataPoint[] => {
  console.log("Reducing noise with advanced filtering, process noise:", processNoise);
  
  if (data.length < 2) {
    console.log("Not enough data points for noise reduction");
    return [...data];
  }

  const smoothedData = [...data];
  const dataByType = data.reduce((acc, point) => {
    const key = `${point.device_id}-${point.data_type}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(point);
    return acc;
  }, {} as Record<string, ArduinoPLCDataPoint[]>);

  Object.values(dataByType).forEach(typeData => {
    typeData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let x = typeData[0].value;
    let p = 1;
    
    typeData.forEach((point, i) => {
      const q = processNoise;
      p = p + q;
      
      const k = p / (p + measurementNoise);
      x = x + k * (point.value - x);
      p = (1 - k) * p;
      
      const index = smoothedData.findIndex(d => 
        d.timestamp === point.timestamp &&
        d.device_id === point.device_id &&
        d.data_type === point.data_type
      );
      
      if (index !== -1) {
        smoothedData[index] = {
          ...smoothedData[index],
          value: Number(x.toFixed(2))
        };
      }
    });
  });

  console.log("Noise reduction completed with Kalman filtering");
  return smoothedData;
};