import { AIInsight, InsightMetadata } from "@/types/ai";

export function useInsightCalculations(insights: AIInsight[]) {
  const calculateEfficiencyMetric = (insights: AIInsight[]): number => {
    const efficiencyInsights = insights.filter(i => {
      const metadata = i.metadata as InsightMetadata;
      return metadata?.type === 'efficiency' || i.insight_type === 'performance';
    });
    
    if (efficiencyInsights.length === 0) return 85;
    
    return efficiencyInsights.reduce((acc, i) => {
      const metadata = i.metadata as InsightMetadata;
      return acc + (metadata?.efficiency || 0);
    }, 0) / efficiencyInsights.length;
  };

  const calculateStabilityMetric = (insights: AIInsight[]): number => {
    const stabilityInsights = insights.filter(i => {
      const metadata = i.metadata as InsightMetadata;
      return metadata?.type === 'stability' || i.insight_type === 'system_health';
    });
    
    if (stabilityInsights.length === 0) return 90;
    
    return stabilityInsights.reduce((acc, i) => {
      const metadata = i.metadata as InsightMetadata;
      return acc + (metadata?.stability || 0);
    }, 0) / stabilityInsights.length;
  };

  return {
    calculateEfficiencyMetric,
    calculateStabilityMetric
  };
}