import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CreateBatchDialog } from "./CreateBatchDialog";
import { BatchDetailsDialog } from "./BatchDetailsDialog";
import { AnnotationHeader } from "./AnnotationHeader";
import { AnnotationGrid } from "./AnnotationGrid";
import { toast } from "sonner";

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
      return batchesWithCounts;
    },
  });

  const handleDeleteBatch = async (batchId: string) => {
    try {
      console.log("Deleting batch:", batchId);
      
      // First delete all annotation items associated with this batch
      const { error: itemsError } = await supabase
        .from("annotation_items")
        .delete()
        .eq("batch_id", batchId);

      if (itemsError) {
        console.error("Error deleting annotation items:", itemsError);
        throw itemsError;
      }

      // Then delete the batch itself
      const { error: batchError } = await supabase
        .from("annotation_batches")
        .delete()
        .eq("id", batchId);

      if (batchError) {
        console.error("Error deleting batch:", batchError);
        throw batchError;
      }

      toast.success("Batch deleted successfully");
      refetch(); // Refresh the batches list
    } catch (error) {
      console.error("Error in handleDeleteBatch:", error);
      toast.error("Failed to delete batch");
    }
  };

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

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <AnnotationHeader 
        onCreateBatch={() => setIsCreateDialogOpen(true)}
        onToggleSort={toggleSortOrder}
        sortOrder={sortOrder}
      />

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
        <AnnotationGrid 
          batches={batches}
          onSelectBatch={setSelectedBatchId}
          onDeleteBatch={handleDeleteBatch}
        />
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