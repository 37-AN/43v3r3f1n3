import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBatchDialog({ open, onOpenChange }: CreateBatchDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dataType: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    if (!formData.name.trim() || !formData.dataType) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    console.log("Creating new annotation batch:", formData);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error("No authenticated user");
      }

      const { error: insertError } = await supabase.from("annotation_batches").insert({
        name: formData.name.trim(),
        description: formData.description.trim(),
        data_type: formData.dataType,
        status: "pending",
        created_by: session.session.user.id
      });

      if (insertError) throw insertError;

      console.log("Successfully created annotation batch");
      toast.success("Annotation batch created successfully");
      queryClient.invalidateQueries({ queryKey: ["annotation-batches"] });
      onOpenChange(false);
      setFormData({ name: "", description: "", dataType: "" });
    } catch (error) {
      console.error("Error creating annotation batch:", error);
      setError("Failed to create annotation batch. Please try again.");
      toast.error("Failed to create annotation batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Annotation Batch</DialogTitle>
          <DialogDescription>
            Create a new batch of data items for annotation.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Batch Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter batch name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter batch description"
              className="resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataType">Data Type <span className="text-red-500">*</span></Label>
            <Select
              value={formData.dataType}
              onValueChange={(value) => setFormData({ ...formData, dataType: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sensor">Sensor Data</SelectItem>
                <SelectItem value="process">Process Data</SelectItem>
                <SelectItem value="quality">Quality Metrics</SelectItem>
                <SelectItem value="maintenance">Maintenance Records</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Batch'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}