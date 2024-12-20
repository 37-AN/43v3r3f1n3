import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface BatchHeaderProps {
  name: string;
  description: string;
  status: string;
  progress: number;
}

export function BatchHeader({ name, description, status, progress }: BatchHeaderProps) {
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

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <span className="capitalize">{status}</span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}