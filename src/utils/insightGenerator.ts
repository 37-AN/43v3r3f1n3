interface InsightResult {
  message: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
}

export const generateInsight = (features: { mean: number; variance: number; range: number }): InsightResult => {
  const { mean, variance, range } = features;
  let message = '';
  let severity: 'info' | 'warning' | 'critical' = 'info';
  let confidence = 0.8;

  if (variance > 1000) {
    message = `High data variability detected (variance: ${variance.toFixed(2)})`;
    severity = 'warning';
  } else if (range > 100) {
    message = `Large value range detected (${range.toFixed(2)} units)`;
    severity = 'warning';
  } else if (Math.abs(mean) > 50) {
    message = `Unusual average value detected (${mean.toFixed(2)})`;
    severity = 'info';
  } else {
    message = `System operating within normal parameters`;
    confidence = 0.95;
  }

  return { message, severity, confidence };
};