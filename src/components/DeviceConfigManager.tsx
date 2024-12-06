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
  
  const { data: configs, isLoading } = useQuery({
    queryKey: ["device-config"],
    queryFn: async () => {
      console.log("Fetching device configurations...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user found");
        return null;
      }

      const { data, error } = await supabase
        .from("device_configurations")
        .select("*")
        .eq("owner_id", user.id);

      if (error) {
        console.error("Error fetching device configurations:", error);
        throw error;
      }

      console.log("Fetched device configurations:", data);
      return data;
    },
  });

  if (isLoading) return null;

  // Use the first configuration or provide defaults
  const activeConfig = configs?.[0] || {
    max_devices: 10,
    max_registers_per_device: 50,
    register_types: ["coil", "holding", "input", "discrete_input"]
  };

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
            Max Devices: {activeConfig.max_devices}
          </Badge>
          <Badge variant="outline">
            Max Registers: {activeConfig.max_registers_per_device}
          </Badge>
          <Badge variant="outline">
            Register Types: {Array.isArray(activeConfig.register_types) 
              ? activeConfig.register_types.length 
              : 4}
          </Badge>
        </div>
      </CardContent>
      <ConfigurationDialog
        open={showConfig}
        onOpenChange={setShowConfig}
        currentConfig={activeConfig}
      />
    </Card>
  );
};