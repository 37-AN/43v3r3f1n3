import { Button } from "@/components/ui/button";

interface RefinementHeaderProps {
  isRefining: boolean;
  onRefine: () => void;
  hasData: boolean;
}

export function RefinementHeader({ isRefining, onRefine, hasData }: RefinementHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold">Data Refinement & AI Annotation</h3>
        <p className="text-sm text-muted-foreground">
          Process and annotate industrial data with AI assistance
        </p>
      </div>
      <Button 
        onClick={onRefine}
        disabled={isRefining || !hasData}
      >
        {isRefining ? "Processing..." : "Refine & Annotate"}
      </Button>
    </div>
  );
}