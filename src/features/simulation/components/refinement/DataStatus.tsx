interface DataStatusProps {
  dataCount: number;
}

export function DataStatus({ dataCount }: DataStatusProps) {
  return (
    <div className="bg-muted p-4 rounded-lg">
      {dataCount > 0 ? (
        <div className="space-y-1">
          <p>{dataCount} metrics available for processing</p>
          <p className="text-xs text-muted-foreground">
            Using AI-powered analysis for data annotation and quality assessment
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No data available for processing. Start the simulation to generate data.
        </p>
      )}
    </div>
  );
}