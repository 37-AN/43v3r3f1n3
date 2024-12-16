import { useArduinoData } from "./arduino/useArduinoData";
import { DataGridContent } from "./arduino/DataGridContent";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function ArduinoPLCDataGrid() {
  const { data: arduinoData, isLoading, error } = useArduinoData();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading PLC data...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500">
          Failed to load PLC data. Please check your connection and try again.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">PLC Data</h2>
      <DataGridContent 
        isLoading={isLoading}
        error={error as Error | null}
        arduinoData={arduinoData}
      />
    </div>
  );
}