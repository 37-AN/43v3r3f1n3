import { AIInsight } from "@/types/ai";
import { InsightMessage } from "../InsightMessage";

interface InsightsContentProps {
  insights: AIInsight[];
  isLoading: boolean;
}

export function InsightsContent({ insights, isLoading }: InsightsContentProps) {
  return (
    <div className="space-y-3">
      {insights.length > 0 ? (
        insights.map((insight) => (
          <InsightMessage key={insight.id} {...insight} />
        ))
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          {isLoading ? 'Loading insights...' : 'No insights available yet'}
        </p>
      )}
    </div>
  );
}