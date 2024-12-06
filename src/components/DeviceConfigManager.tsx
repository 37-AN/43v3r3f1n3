import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { ConfigurationDialog } from "./ConfigurationDialog";

export const DeviceConfigManager = () => {
  const [showConfig, setShowConfig] = useState(false);
  
  const { data: config, isLoading } = useQuery({
    queryKey: ["device-config"],
    queryFn: async () => {
      console.log("Fetching device configuration...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user found");
        return null;
      }

      const { data, error } = await supabase
        .from("device_configurations")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching device configuration:", error);
        throw error;
      }

      console.log("Fetched device configuration:", data);
      return data;
    },
  });

  if (isLoading) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Device Configuration</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowConfig(true)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            Max Devices: {config?.max_devices || 10}
          </Badge>
          <Badge variant="outline">
            Max Registers: {config?.max_registers_per_device || 50}
          </Badge>
          <Badge variant="outline">
            Register Types: {config?.register_types?.length || 4}
          </Badge>
        </div>
      </CardContent>
      <ConfigurationDialog
        open={showConfig}
        onOpenChange={setShowConfig}
        currentConfig={config}
      />
    </Card>
  );
};