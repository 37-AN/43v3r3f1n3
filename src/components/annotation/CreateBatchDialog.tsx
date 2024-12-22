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
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Record<string, number>;
}

export function CreateBatchDialog({ open, onOpenChange, initialData }: CreateBatchDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true);
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

      if (useAI && initialData) {
        console.log("Using AI to analyze and create batch");
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('annotation-ai-analysis', {
          body: {
            rawData: Object.entries(initialData).map(([metric_type, value]) => ({
              metric_type,
              value,
              timestamp: new Date().toISOString()
            })),
            dataType: formData.dataType,
            deviceId: session.session.user.id
          }
        });

        if (aiError) {
          console.error('AI analysis error:', aiError);
          throw aiError;
        }

        console.log("AI analysis completed:", aiResult);
        toast.success("Batch created with AI assistance");
      } else {
        const { error: insertError } = await supabase.from("annotation_batches").insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          data_type: formData.dataType,
          status: "pending",
          created_by: session.session.user.id
        });

        if (insertError) throw insertError;
        toast.success("Annotation batch created successfully");
      }

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
          {initialData && (
            <div className="flex items-center space-x-2">
              <Switch
                id="useAI"
                checked={useAI}
                onCheckedChange={setUseAI}
              />
              <Label htmlFor="useAI" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Use AI assistance
              </Label>
            </div>
          )}
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