import { Card } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RegisterForm } from "./simulation/RegisterForm";

export function SimulationControl() {
  const [address, setAddress] = useState("0");
  const [value, setValue] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

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
      
      toast.success('Register updated successfully');
    } catch (error) {
      console.error('Error writing register:', error);
      toast.error('Failed to update register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
  );
}