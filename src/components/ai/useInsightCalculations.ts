import { AIInsight } from "@/types/ai";

export function useInsightCalculations(insights: AIInsight[]) {
  const calculateEfficiencyMetric = (insights: AIInsight[]): number => {
    const efficiencyInsights = insights.filter(i => 
      i.metadata?.type === 'efficiency' || i.insight_type === 'performance'
    );
    if (efficiencyInsights.length === 0) return 85;
    return efficiencyInsights.reduce((acc, i) => acc + (i.metadata?.efficiency || 0), 0) / efficiencyInsights.length;
  };

  const calculateStabilityMetric = (insights: AIInsight[]): number => {
    const stabilityInsights = insights.filter(i => 
      i.metadata?.type === 'stability' || i.insight_type === 'system_health'
    );
    if (stabilityInsights.length === 0) return 90;
    return stabilityInsights.reduce((acc, i) => acc + (i.metadata?.stability || 0), 0) / stabilityInsights.length;
  };

  return {
    calculateEfficiencyMetric,
    calculateStabilityMetric
  };
}