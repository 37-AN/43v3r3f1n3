import { Card } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RegisterForm } from "./simulation/RegisterForm";
import { WriteHistory } from "./simulation/WriteHistory";
import { logRegisterOperation } from "@/utils/registerLogger";

interface WriteHistoryEntry {
  timestamp: string;
  address: number;
  value: number;
}

export function SimulationControl() {
  const [address, setAddress] = useState("0");
  const [value, setValue] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [writeHistory, setWriteHistory] = useState<WriteHistoryEntry[]>([]);

  const writeRegister = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('modbus-server', {
        method: 'POST',
        body: {
          functionCode: 6, // Write Single Register
          address: parseInt(address),
          values: [parseInt(value)]
        }
      });

      if (error) throw error;
      
      const timestamp = new Date().toISOString();
      
      // Log the operation
      logRegisterOperation({
        operation: 'write',
        address: parseInt(address),
        value: parseInt(value),
        timestamp
      });
      
      // Store simulation data in arduino_plc_data
      const { error: dbError } = await supabase
        .from('arduino_plc_data')
        .insert({
          device_id: 'e2fae487-1ee2-4ea2-b87f-decedb7d12a5', // Using the existing device
          data_type: 'register',
          value: parseInt(value),
          metadata: {
            address: parseInt(address),
            simulation: true
          }
        });

      if (dbError) {
        console.error('Error storing simulation data:', dbError);
        throw dbError;
      }
      
      // Add to history
      setWriteHistory(prev => [{
        timestamp,
        address: parseInt(address),
        value: parseInt(value)
      }, ...prev].slice(0, 50)); // Keep last 50 entries

      console.log('Simulation data stored successfully');
      toast.success('Register updated and data stored successfully');
    } catch (error) {
      console.error('Error writing register:', error);
      toast.error('Failed to update register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 animate-fade-up glass-panel">
        <h3 className="text-lg font-semibold text-system-gray-900 mb-4">Simulation Control</h3>
        <RegisterForm
          address={address}
          value={value}
          onAddressChange={setAddress}
          onValueChange={setValue}
          onSubmit={writeRegister}
          isLoading={isLoading}
        />
      </Card>
      <WriteHistory history={writeHistory} />
    </div>
  );
}