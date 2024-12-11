import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateDeviceAccess } from "./DeviceValidation";

export const startSimulation = async (deviceId: string) => {
  try {
    if (!await validateDeviceAccess(supabase, deviceId)) {
      return null;
    }

    const simulationData = {
      device_id: deviceId,
      simulation_type: 'modbus',
      parameters: {
        port: 502,
        slave_id: 1,
        registers: [
          { address: 0, value: Math.floor(Math.random() * 1000) },
          { address: 1, value: Math.floor(Math.random() * 1000) }
        ]
      },
      is_running: true
    };

    const { data, error } = await supabase
      .from('device_simulations')
      .insert([simulationData])
      .select()
      .single();

    if (error) {
      console.error('Error starting simulation:', error);
      toast.error('Failed to start simulation');
      return null;
    }

    console.log('Started simulation:', data);
    toast.success('Simulation started');
    return data;
  } catch (error) {
    console.error('Error in simulation start:', error);
    toast.error('Failed to start simulation');
    return null;
  }
};

export const stopSimulation = async (deviceId: string) => {
  try {
    if (!await validateDeviceAccess(supabase, deviceId)) {
      return false;
    }

    const { error } = await supabase
      .from('device_simulations')
      .update({ is_running: false })
      .eq('device_id', deviceId);

    if (error) {
      console.error('Error stopping simulation:', error);
      toast.error('Failed to stop simulation');
      return false;
    }

    console.log('Stopped simulation for device:', deviceId);
    toast.success('Simulation stopped');
    return true;
  } catch (error) {
    console.error('Error stopping simulation:', error);
    toast.error('Failed to stop simulation');
    return false;
  }
};