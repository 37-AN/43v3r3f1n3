import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Check, AlertCircle, ClipboardList } from "lucide-react";

export const QualityTab = () => {
  const { data: qualityStats, isLoading: isLoadingQuality } = useQuery({
    queryKey: ["quality-reviews"],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("quality_reviews")
        .select(`
          status,
          feedback,
          annotations (
            id,
            status,
            annotation_data
          )
        `);

      if (error) throw error;

      const stats = {
        total: reviews?.length || 0,
        pending: reviews?.filter(r => r.status === 'pending').length || 0,
        approved: reviews?.filter(r => r.status === 'approved').length || 0,
        rejected: reviews?.filter(r => r.status === 'rejected').length || 0,
      };

      return stats;
    },
  });

  if (isLoadingQuality) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[140px]" />
        <Skeleton className="h-[140px]" />
        <Skeleton className="h-[140px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quality Control Dashboard</h2>
        <p className="text-muted-foreground">Monitor and manage annotation quality reviews</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total quality reviews conducted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityStats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground">
              Annotations approved by reviewers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityStats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Annotations awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {qualityStats?.total === 0 && (
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Quality Reviews Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start annotating data to generate quality reviews.
            </p>
            <Button
              onClick={() => {
                const annotationTab = document.querySelector<HTMLButtonElement>('[value="annotation"]');
                if (annotationTab) {
                  annotationTab.click();
                }
              }}
              variant="outline"
            >
              Go to Annotation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};