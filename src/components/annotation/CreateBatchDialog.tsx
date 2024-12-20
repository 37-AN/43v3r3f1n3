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

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBatchDialog({ open, onOpenChange }: CreateBatchDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dataType: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("annotation_batches").insert({
        name: formData.name,
        description: formData.description,
        data_type: formData.dataType,
      });

      if (error) throw error;

      toast.success("Annotation batch created successfully");
      queryClient.invalidateQueries({ queryKey: ["annotation-batches"] });
      onOpenChange(false);
      setFormData({ name: "", description: "", dataType: "" });
    } catch (error) {
      console.error("Error creating annotation batch:", error);
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Batch Name</Label>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataType">Data Type</Label>
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
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Batch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}