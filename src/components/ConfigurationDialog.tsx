import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: any;
}

export const ConfigurationDialog = ({
  open,
  onOpenChange,
  currentConfig,
}: ConfigurationDialogProps) => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    max_devices: 10,
    max_registers_per_device: 50,
  });

  // Update local state when currentConfig changes
  useEffect(() => {
    if (currentConfig) {
      setConfig({
        max_devices: currentConfig.max_devices || 10,
        max_registers_per_device: currentConfig.max_registers_per_device || 50,
      });
    }
  }, [currentConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to update configuration");
      return;
    }

    try {
      console.log("Updating device configuration...");
      const { error } = await supabase
        .from("device_configurations")
        .upsert({
          id: currentConfig.id,
          owner_id: user.id,
          name: currentConfig.name, // Keep existing name
          ...config,
          register_types: ["coil", "holding", "input", "discrete_input"],
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Configuration updated successfully");
      queryClient.invalidateQueries({ queryKey: ["device-config"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating configuration:", error);
      toast.error("Failed to update configuration");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Device Configuration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max_devices">Maximum Devices</Label>
            <Input
              id="max_devices"
              type="number"
              value={config.max_devices}
              onChange={(e) =>
                setConfig({ ...config, max_devices: parseInt(e.target.value) })
              }
              min="1"
              max="100"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_registers">Maximum Registers per Device</Label>
            <Input
              id="max_registers"
              type="number"
              value={config.max_registers_per_device}
              onChange={(e) =>
                setConfig({
                  ...config,
                  max_registers_per_device: parseInt(e.target.value),
                })
              }
              min="1"
              max="1000"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Configuration</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};