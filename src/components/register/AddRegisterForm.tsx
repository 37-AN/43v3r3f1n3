import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { logRegisterOperation } from "@/utils/registerLogger";

interface AddRegisterFormProps {
  deviceId: string;
}

export const AddRegisterForm = ({ deviceId }: AddRegisterFormProps) => {
  const queryClient = useQueryClient();
  const [newRegister, setNewRegister] = useState({
    address: "",
    register_type: "holding",
    description: "",
    initial_value: "0",
    min_value: "",
    max_value: "",
  });

  const validateRegisterData = () => {
    if (!newRegister.address || newRegister.address.trim() === "") {
      toast.error("Address is required");
      return false;
    }

    const addressNum = parseInt(newRegister.address);
    if (isNaN(addressNum) || addressNum < 0) {
      toast.error("Address must be a valid positive number");
      return false;
    }

    return true;
  };

  const handleAddRegister = async () => {
    try {
      if (!validateRegisterData()) {
        return;
      }

      console.log("Adding register with data:", {
        plc_id: deviceId,
        ...newRegister,
      });

      const { data, error } = await supabase.from("plc_registers").insert([
        {
          plc_id: deviceId,
          address: parseInt(newRegister.address),
          register_type: newRegister.register_type,
          description: newRegister.description,
          initial_value: parseInt(newRegister.initial_value),
          min_value: newRegister.min_value ? parseInt(newRegister.min_value) : null,
          max_value: newRegister.max_value ? parseInt(newRegister.max_value) : null,
        },
      ]);

      if (error) throw error;

      // Log the operation
      logRegisterOperation({
        operation: 'add',
        address: parseInt(newRegister.address),
        value: parseInt(newRegister.initial_value),
        register_type: newRegister.register_type,
        timestamp: new Date().toISOString(),
        deviceId
      });

      toast.success("Register added successfully");
      queryClient.invalidateQueries({ queryKey: ["plc-registers", deviceId] });
      setNewRegister({
        address: "",
        register_type: "holding",
        description: "",
        initial_value: "0",
        min_value: "",
        max_value: "",
      });
    } catch (error) {
      console.error("Error adding register:", error);
      toast.error("Failed to add register");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Add New Register</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            type="number"
            value={newRegister.address}
            onChange={(e) =>
              setNewRegister({ ...newRegister, address: e.target.value })
            }
            min="0"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register_type">Type</Label>
          <Select
            value={newRegister.register_type}
            onValueChange={(value) =>
              setNewRegister({ ...newRegister, register_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coil">Coil</SelectItem>
              <SelectItem value="discrete_input">Discrete Input</SelectItem>
              <SelectItem value="holding">Holding Register</SelectItem>
              <SelectItem value="input">Input Register</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={newRegister.description}
          onChange={(e) =>
            setNewRegister({ ...newRegister, description: e.target.value })
          }
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="initial_value">Initial Value</Label>
          <Input
            id="initial_value"
            type="number"
            value={newRegister.initial_value}
            onChange={(e) =>
              setNewRegister({ ...newRegister, initial_value: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_value">Min Value</Label>
          <Input
            id="min_value"
            type="number"
            value={newRegister.min_value}
            onChange={(e) =>
              setNewRegister({ ...newRegister, min_value: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_value">Max Value</Label>
          <Input
            id="max_value"
            type="number"
            value={newRegister.max_value}
            onChange={(e) =>
              setNewRegister({ ...newRegister, max_value: e.target.value })
            }
          />
        </div>
      </div>
      <Button onClick={handleAddRegister} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Register
      </Button>
    </div>
  );
};