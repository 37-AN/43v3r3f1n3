interface Features {
  mean: number;
  variance: number;
  range: number;
}

export const generateInsight = (features: Features) => {
  const { mean, variance, range } = features;
  
  // Determine severity based on variance and range
  let severity: 'info' | 'warning' | 'critical' = 'info';
  if (variance > 1000) {
    severity = 'critical';
  } else if (variance > 500) {
    severity = 'warning';
  }

  // Generate message based on features
  let message = '';
  if (variance > 1000) {
    message = `High variability detected in measurements (variance: ${variance.toFixed(2)})`;
  } else if (range > 100) {
    message = `Significant range in measurements detected (range: ${range.toFixed(2)})`;
  } else {
    message = `Stable operation with average value of ${mean.toFixed(2)}`;
  }

  return {
    message,
    severity,
    confidence: 0.85
  };
};