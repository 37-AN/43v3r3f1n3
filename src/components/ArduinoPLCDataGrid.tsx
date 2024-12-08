import { useArduinoData } from "./arduino/useArduinoData";
import { DataGridContent } from "./arduino/DataGridContent";

export function ArduinoPLCDataGrid() {
  const { data: arduinoData, isLoading, error } = useArduinoData();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Arduino PLC Data</h2>
      <DataGridContent 
        isLoading={isLoading}
        error={error as Error | null}
        arduinoData={arduinoData}
      />
    </div>
  );
}