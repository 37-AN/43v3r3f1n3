import { AIInsight } from '@/types/ai';
import { useInsightCalculations } from '../useInsightCalculations';
import { InsightMetrics } from '../InsightMetrics';
import { useEffect, useState } from 'react';

interface InsightsMetricsContainerProps {
  insights: AIInsight[];
}

export function InsightsMetricsContainer({ insights }: InsightsMetricsContainerProps) {
  const [metrics, setMetrics] = useState({
    efficiency: 0,
    stability: 0,
    anomalyCount: 0
  });
  
  const { calculateEfficiencyMetric, calculateStabilityMetric } = useInsightCalculations(insights);

  useEffect(() => {
    const efficiency = calculateEfficiencyMetric(insights);
    const stability = calculateStabilityMetric(insights);
    const anomalyCount = insights.filter(i => i.severity === 'critical').length;

    setMetrics({
      efficiency,
      stability,
      anomalyCount
    });
  }, [insights, calculateEfficiencyMetric, calculateStabilityMetric]);

  return (
    <InsightMetrics 
      efficiency={metrics.efficiency}
      stability={metrics.stability}
      anomalyCount={metrics.anomalyCount}
    />
  );
}