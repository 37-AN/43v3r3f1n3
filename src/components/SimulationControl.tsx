import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function SimulationControl() {
  const [address, setAddress] = useState("0");
  const [value, setValue] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  const writeRegister = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/modbus-server`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            functionCode: 6, // Write Single Register
            address: parseInt(address),
            values: [parseInt(value)]
          })
        }
      );

      if (!response.ok) throw new Error('Failed to write register');
      
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
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Register Address</Label>
          <Input
            id="address"
            type="number"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            min="0"
            max="65535"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min="0"
            max="65535"
          />
        </div>
        <Button 
          onClick={writeRegister} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Updating...' : 'Write Register'}
        </Button>
      </div>
    </Card>
  );
}