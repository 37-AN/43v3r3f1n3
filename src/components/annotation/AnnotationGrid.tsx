import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { AnnotationBatch } from "@/types/annotation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AnnotationGridProps {
  batches: AnnotationBatch[];
  onSelectBatch: (batchId: string) => void;
  onDeleteBatch: (batchId: string) => void;
}

export function AnnotationGrid({ batches, onSelectBatch, onDeleteBatch }: AnnotationGridProps) {
  const calculateProgress = (completed?: number, total?: number) => {
    if (!completed || !total) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {batches?.map((batch) => (
        <Card 
          key={batch.id} 
          className="hover:shadow-lg transition-shadow"
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="cursor-pointer" onClick={() => onSelectBatch(batch.id)}>
              <CardTitle>{batch.name}</CardTitle>
              <CardDescription>{batch.description}</CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Annotation Batch</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this batch? This action cannot be undone.
                    All annotation items associated with this batch will also be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteBatch(batch.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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