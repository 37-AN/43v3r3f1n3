import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, SortAsc } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreateBatchDialog } from "./CreateBatchDialog";
import { BatchDetailsDialog } from "./BatchDetailsDialog";
import { toast } from "sonner";

interface AnnotationBatch {
  id: string;
  name: string;
  description: string;
  data_type: string;
  status: string;
  created_at: string;
  total_items?: number;
  completed_items?: number;
}

export function AnnotationDashboard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: batches, isLoading, error, refetch } = useQuery({
    queryKey: ["annotation-batches"],
    queryFn: async () => {
      console.log("Fetching annotation batches...");
      const { data: batchesData, error: batchesError } = await supabase
        .from("annotation_batches")
        .select("*")
        .order("created_at", { ascending: sortOrder === 'asc' });

      if (batchesError) {
        console.error("Error fetching batches:", batchesError);
        throw batchesError;
      }

      // Fetch items count for each batch
      const batchesWithCounts = await Promise.all(
        batchesData.map(async (batch) => {
          const { count: totalItems } = await supabase
            .from("annotation_items")
            .select("*", { count: "exact", head: true })
            .eq("batch_id", batch.id);

          const { count: completedItems } = await supabase
            .from("annotation_items")
            .select("*", { count: "exact", head: true })
            .eq("batch_id", batch.id)
            .eq("status", "completed");

          return {
            ...batch,
            total_items: totalItems,
            completed_items: completedItems,
          };
        })
      );

      console.log("Fetched batches with counts:", batchesWithCounts);
      return batchesWithCounts as AnnotationBatch[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'annotation_batches'
        },
        () => {
          console.log("Annotation batches updated, refreshing...");
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (error) {
    console.error("Error in annotation dashboard:", error);
    toast.error("Failed to load annotation batches");
  }

  const calculateProgress = (completed?: number, total?: number) => {
    if (!completed || !total) return 0;
    return Math.round((completed / total) * 100);
  };

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Data Annotation</h2>
          <p className="text-muted-foreground">Manage and track annotation tasks</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={toggleSortOrder}
            className="flex items-center gap-2"
          >
            <SortAsc className="w-4 h-4" />
            {sortOrder === 'asc' ? 'Newest First' : 'Oldest First'}
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Batch
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading annotation batches...</span>
        </div>
      ) : batches?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No Annotation Batches</h3>
            <p className="text-muted-foreground mb-4">Create your first batch to start annotating data.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create Batch</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches?.map((batch) => (
            <Card 
              key={batch.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedBatchId(batch.id)}
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
      )}

      <CreateBatchDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
      />

      <BatchDetailsDialog
        batchId={selectedBatchId}
        onOpenChange={(open) => !open && setSelectedBatchId(null)}
      />
    </div>
  );
}