import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BatchHeader } from "./BatchHeader";
import { BatchItemsList } from "./BatchItemsList";

interface BatchDetailsDialogProps {
  batchId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function BatchDetailsDialog({ batchId, onOpenChange }: BatchDetailsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: batchDetails, isLoading, error } = useQuery({
    queryKey: ["annotation-batch-details", batchId],
    queryFn: async () => {
      if (!batchId) return null;
      console.log("Fetching batch details for:", batchId);

      const { data: batch, error: batchError } = await supabase
        .from("annotation_batches")
        .select(`
          *,
          annotation_items (
            id,
            status,
            raw_data,
            refined_data,
            assigned_to
          )
        `)
        .eq("id", batchId)
        .single();

      if (batchError) {
        console.error("Error fetching batch details:", batchError);
        throw batchError;
      }

      console.log("Fetched batch details:", batch);
      return batch;
    },
    enabled: !!batchId,
  });

  const handleStartAnnotation = async () => {
    if (!batchId) return;
    setIsSubmitting(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("No authenticated user");
      }

      // First update batch status
      const { error: batchError } = await supabase
        .from("annotation_batches")
        .update({ 
          status: "in_progress",
          updated_at: new Date().toISOString()
        })
        .eq("id", batchId);

      if (batchError) throw batchError;

      // Then assign items to current user if not already assigned
      if (batchDetails?.annotation_items) {
        const unassignedItems = batchDetails.annotation_items
          .filter(item => !item.assigned_to)
          .map(item => ({
            id: item.id,
            assigned_to: session.user.id,
            status: "pending"
          }));

        if (unassignedItems.length > 0) {
          const { error: itemsError } = await supabase
            .from("annotation_items")
            .upsert(unassignedItems);

          if (itemsError) throw itemsError;
        }
      }

      toast.success("Started annotation process");
    } catch (error) {
      console.error("Error starting annotation:", error);
      toast.error("Failed to start annotation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    console.error("Error in batch details:", error);
    toast.error("Failed to load batch details");
  }

  const calculateProgress = () => {
    if (!batchDetails?.annotation_items?.length) return 0;
    return (
      (batchDetails.annotation_items.filter((item) => item.status === "completed").length /
        batchDetails.annotation_items.length) *
      100
    );
  };

  return (
    <Dialog open={!!batchId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading batch details...</span>
          </div>
        ) : !batchDetails ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No batch details found</p>
          </div>
        ) : (
          <div className="space-y-4">
            <BatchHeader
              name={batchDetails.name}
              description={batchDetails.description}
              status={batchDetails.status}
              progress={calculateProgress()}
            />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Annotation Items</h4>
              <BatchItemsList items={batchDetails.annotation_items || []} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                onClick={handleStartAnnotation}
                disabled={isSubmitting || batchDetails.status !== "pending"}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Annotation"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}