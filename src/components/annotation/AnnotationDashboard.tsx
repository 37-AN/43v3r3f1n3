import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreateBatchDialog } from "./CreateBatchDialog";

interface AnnotationBatch {
  id: string;
  name: string;
  description: string;
  data_type: string;
  status: string;
  created_at: string;
}

export function AnnotationDashboard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: batches, isLoading, error } = useQuery({
    queryKey: ["annotation-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("annotation_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AnnotationBatch[];
    },
  });

  if (error) {
    console.error("Error fetching annotation batches:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Data Annotation</h2>
          <p className="text-gray-600">Manage and track annotation tasks</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Batch
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading annotation batches...</span>
        </div>
      ) : batches?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No Annotation Batches</h3>
            <p className="text-gray-600 mb-4">Create your first batch to start annotating data.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create Batch</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches?.map((batch) => (
            <Card key={batch.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{batch.name}</CardTitle>
                <CardDescription>{batch.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium capitalize">{batch.status}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} />
                  </div>
                  <Button className="w-full" variant="outline">
                    View Details
                  </Button>
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
    </div>
  );
}