import { useArduinoData } from "./arduino/useArduinoData";
import { DataGridContent } from "./arduino/DataGridContent";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ArduinoPLCDataGrid() {
  const { data: arduinoData, isLoading, error } = useArduinoData();

  if (error) {
    toast.error("Failed to load PLC data");
    return (
      <Card className="p-6">
        <div className="text-red-500">
          Failed to load PLC data: {error.message}
        </div>
      </Card>
    );
  }

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

  if (!arduinoData || arduinoData.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>No PLC data available.</p>
          <p className="text-sm mt-2">Please check your device connections or wait for new data to be recorded.</p>
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