import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

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
        .select("*, annotation_items(*)")
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-system-mint" />;
      case "pending":
        return <Clock className="w-4 h-4 text-system-amber" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-system-red" />;
      default:
        return null;
    }
  };

  const handleStartAnnotation = async () => {
    if (!batchId) return;
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("annotation_batches")
        .update({ status: "in_progress" })
        .eq("id", batchId);

      if (error) throw error;
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
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-semibold">{batchDetails.name}</h3>
                <p className="text-sm text-muted-foreground">{batchDetails.description}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(batchDetails.status)}
                  <span className="capitalize">{batchDetails.status}</span>
                </div>
              </div>

              <Progress 
                value={
                  batchDetails.annotation_items?.length
                    ? (batchDetails.annotation_items.filter(item => item.status === "completed").length /
                        batchDetails.annotation_items.length) *
                      100
                    : 0
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Annotation Items</h4>
              {batchDetails.annotation_items?.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No items to annotate</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-2">
                  {batchDetails.annotation_items?.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <span className="text-sm capitalize">{item.status}</span>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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