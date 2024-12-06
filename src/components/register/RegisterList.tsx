import { Button } from "@/components/ui/button";
import { Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logRegisterOperation } from "@/utils/registerLogger";

interface Register {
  id: string;
  address: number;
  register_type: string;
  description: string;
}

interface RegisterListProps {
  registers: Register[] | null;
  isLoading: boolean;
  deviceId: string;
}

export const RegisterList = ({ registers, isLoading, deviceId }: RegisterListProps) => {
  const queryClient = useQueryClient();

  const handleDeleteRegister = async (registerId: string) => {
    try {
      const registerToDelete = registers?.find(r => r.id === registerId);
      if (!registerToDelete) return;

      console.log("Deleting register:", registerId);
      const { error } = await supabase
        .from("plc_registers")
        .delete()
        .eq("id", registerId);

      if (error) throw error;

      // Log the operation
      logRegisterOperation({
        operation: 'delete',
        address: registerToDelete.address,
        register_type: registerToDelete.register_type,
        timestamp: new Date().toISOString(),
        deviceId
      });

      toast.success("Register deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["plc-registers", deviceId] });
    } catch (error) {
      console.error("Error deleting register:", error);
      toast.error("Failed to delete register");
    }
  };

  if (isLoading) {
    return <div>Loading registers...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Configured Registers</h3>
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
    </div>
  );
};