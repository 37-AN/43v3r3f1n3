import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnnotationBatch } from "@/types/annotation";

interface AnnotationGridProps {
  batches: AnnotationBatch[];
  onSelectBatch: (batchId: string) => void;
}

export function AnnotationGrid({ batches, onSelectBatch }: AnnotationGridProps) {
  const calculateProgress = (completed?: number, total?: number) => {
    if (!completed || !total) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {batches?.map((batch) => (
        <Card 
          key={batch.id} 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onSelectBatch(batch.id)}
        >
          <CardHeader>
            <CardTitle>{batch.name}</CardTitle>
            <CardDescription>{batch.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{batch.status}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {calculateProgress(batch.completed_items, batch.total_items)}%
                  </span>
                </div>
                <Progress 
                  value={calculateProgress(batch.completed_items, batch.total_items)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {batch.completed_items || 0} of {batch.total_items || 0} items completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}