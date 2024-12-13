import { AIInsight } from "@/types/ai";
import { InsightMessage } from "../InsightMessage";
import { Skeleton } from "@/components/ui/skeleton";

interface InsightsDisplayProps {
  insights: AIInsight[];
  isLoading?: boolean;
}

export function InsightsDisplay({ insights, isLoading }: InsightsDisplayProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.length > 0 ? (
        insights.map((insight) => (
          <InsightMessage 
            key={insight.id}
            id={insight.id}
            message={insight.message}
            severity={insight.severity}
            confidence={insight.confidence || 0}
            created_at={insight.created_at || new Date().toISOString()}
            metadata={insight.metadata as Record<string, any>}
          />
        ))
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          No insights available yet
        </p>
      )}
    </div>
  );
}