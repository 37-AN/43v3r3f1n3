import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddRegisterForm } from "./register/AddRegisterForm";
import { RegisterList } from "./register/RegisterList";

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Register Configuration</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <AddRegisterForm deviceId={deviceId} />
          <RegisterList 
            registers={registers} 
            isLoading={isLoading} 
            deviceId={deviceId}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};