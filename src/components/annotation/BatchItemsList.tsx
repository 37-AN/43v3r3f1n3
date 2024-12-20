import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface BatchItem {
  id: string;
  status: string;
}

interface BatchItemsListProps {
  items: BatchItem[];
}

export function BatchItemsList({ items }: BatchItemsListProps) {
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

  if (items?.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No items to annotate</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-2">
      {items?.map((item) => (
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
  );
}