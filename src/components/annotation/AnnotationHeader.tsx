import { Button } from "@/components/ui/button";
import { Plus, SortAsc } from "lucide-react";

interface AnnotationHeaderProps {
  onCreateBatch: () => void;
  onToggleSort: () => void;
  sortOrder: 'asc' | 'desc';
}

export function AnnotationHeader({ onCreateBatch, onToggleSort, sortOrder }: AnnotationHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">Data Annotation</h2>
        <p className="text-muted-foreground">Manage and track annotation tasks</p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onToggleSort}
          className="flex items-center gap-2"
        >
          <SortAsc className="w-4 h-4" />
          {sortOrder === 'asc' ? 'Newest First' : 'Oldest First'}
        </Button>
        <Button onClick={onCreateBatch} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Batch
        </Button>
      </div>
    </div>
  );
}