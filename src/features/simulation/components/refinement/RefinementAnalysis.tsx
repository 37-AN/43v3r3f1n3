import { CheckCircle2 } from "lucide-react";

interface RefinementAnalysisProps {
  analysis: {
    metricsProcessed: number;
    qualityScore: number;
    anomalies: number;
  };
}

export function RefinementAnalysis({ analysis }: RefinementAnalysisProps) {
  return (
    <div className="bg-muted rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <h4 className="font-medium">Analysis Results</h4>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Metrics Processed</p>
          <p className="text-lg font-medium">{analysis.metricsProcessed}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Quality Score</p>
          <p className="text-lg font-medium">{(analysis.qualityScore * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Anomalies</p>
          <p className="text-lg font-medium">{analysis.anomalies}</p>
        </div>
      </div>
    </div>
  );
}