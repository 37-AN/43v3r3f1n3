import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DeviceBasicInfo } from "./plc/DeviceBasicInfo";
import { DeviceProtocolSettings } from "./plc/DeviceProtocolSettings";

interface NewPLCDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewPLCDeviceDialog = ({ open, onOpenChange }: NewPLCDeviceDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ip_address: "",
    port: "502",
    slave_id: "1",
    protocol: "modbus",
    rack: "0",
    slot: "1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to add a device");
      return;
    }

    try {
      console.log("Creating PLC device with owner_id:", user.id);
      const { error } = await supabase.from("plc_devices").insert([
        {
          name: formData.name,
          description: formData.description,
          ip_address: formData.ip_address,
          port: parseInt(formData.port),
          slave_id: parseInt(formData.slave_id),
          protocol: formData.protocol,
          rack: parseInt(formData.rack),
          slot: parseInt(formData.slot),
          owner_id: user.id,
        },
      ]);

      if (error) throw error;

      toast.success("PLC device added successfully");
      queryClient.invalidateQueries({ queryKey: ["plc-devices"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding PLC device:", error);
      toast.error("Failed to add PLC device");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New PLC Device</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DeviceBasicInfo
            name={formData.name}
            description={formData.description}
            onNameChange={(value) => setFormData({ ...formData, name: value })}
            onDescriptionChange={(value) => setFormData({ ...formData, description: value })}
          />
          <DeviceProtocolSettings
            protocol={formData.protocol}
            ipAddress={formData.ip_address}
            port={formData.port}
            slaveId={formData.slave_id}
            rack={formData.rack}
            slot={formData.slot}
            onProtocolChange={(value) => setFormData({ ...formData, protocol: value })}
            onIpAddressChange={(value) => setFormData({ ...formData, ip_address: value })}
            onPortChange={(value) => setFormData({ ...formData, port: value })}
            onSlaveIdChange={(value) => setFormData({ ...formData, slave_id: value })}
            onRackChange={(value) => setFormData({ ...formData, rack: value })}
            onSlotChange={(value) => setFormData({ ...formData, slot: value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Device</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};