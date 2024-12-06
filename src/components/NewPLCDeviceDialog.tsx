import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the current user's ID
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
          owner_id: user.id, // Add the owner_id
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
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ip_address">IP Address</Label>
            <Input
              id="ip_address"
              value={formData.ip_address}
              onChange={(e) =>
                setFormData({ ...formData, ip_address: e.target.value })
              }
              placeholder="192.168.1.100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) =>
                  setFormData({ ...formData, port: e.target.value })
                }
                min="1"
                max="65535"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slave_id">Slave ID</Label>
              <Input
                id="slave_id"
                type="number"
                value={formData.slave_id}
                onChange={(e) =>
                  setFormData({ ...formData, slave_id: e.target.value })
                }
                min="1"
                max="247"
              />
            </div>
          </div>
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