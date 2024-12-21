import { Progress } from "@/components/ui/progress";

interface RefinementProgressProps {
  progress: number;
}

export function RefinementProgress({ progress }: RefinementProgressProps) {
  return (
    <div className="space-y-2">
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-muted-foreground text-center">
        {progress === 100 ? "Processing complete!" : "Processing data..."}
      </p>
    </div>
  );
}