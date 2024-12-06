import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RegisterConfigPanelProps {
  deviceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegisterConfigPanel = ({
  deviceId,
  open,
  onOpenChange,
}: RegisterConfigPanelProps) => {
  const queryClient = useQueryClient();
  const [newRegister, setNewRegister] = useState({
    address: "",
    register_type: "holding",
    description: "",
    initial_value: "0",
    min_value: "",
    max_value: "",
  });

  const { data: registers, isLoading } = useQuery({
    queryKey: ["plc-registers", deviceId],
    queryFn: async () => {
      console.log("Fetching registers for device:", deviceId);
      const { data, error } = await supabase
        .from("plc_registers")
        .select("*")
        .eq("plc_id", deviceId)
        .order("address", { ascending: true });

      if (error) {
        console.error("Error fetching registers:", error);
        throw error;
      }

      console.log("Fetched registers:", data);
      return data;
    },
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

      const { error } = await supabase.from("plc_registers").insert([
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

  const handleDeleteRegister = async (registerId: string) => {
    try {
      console.log("Deleting register:", registerId);
      const { error } = await supabase
        .from("plc_registers")
        .delete()
        .eq("id", registerId);

      if (error) throw error;

      toast.success("Register deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["plc-registers", deviceId] });
    } catch (error) {
      console.error("Error deleting register:", error);
      toast.error("Failed to delete register");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Register Configuration</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
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

          <div className="space-y-4">
            <h3 className="font-medium">Configured Registers</h3>
            {isLoading ? (
              <div>Loading registers...</div>
            ) : (
              <div className="space-y-2">
                {registers?.map((register) => (
                  <div
                    key={register.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <div className="font-medium">
                        Address: {register.address} ({register.register_type})
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {register.description}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteRegister(register.id)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};