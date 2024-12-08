import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Source {
  id: string;
  name: string;
  deviceId: string;
  connected: boolean;
  lastUpdate: Date | null;
}

export const initializeDevices = async (userId: string): Promise<Source[]> => {
  console.log('Initializing data sources for user:', userId);
  
  const initialSources = [
    { 
      id: 'mes-1', 
      name: 'MES System',
      deviceId: '',
      connected: false,
      lastUpdate: null
    },
    { 
      id: 'scada-1', 
      name: 'SCADA Controller',
      deviceId: '',
      connected: false,
      lastUpdate: null
    },
    { 
      id: 'iot-gateway', 
      name: 'IoT Gateway',
      deviceId: '',
      connected: false,
      lastUpdate: null
    }
  ];

  try {
    const updatedSources = await Promise.all(
      initialSources.map(async (source) => {
        try {
          console.log(`Looking for existing device: ${source.name}`);
          const { data: existingDevices, error: fetchError } = await supabase
            .from('plc_devices')
            .select('id')
            .eq('name', source.name)
            .eq('owner_id', userId);

          if (fetchError) {
            console.error(`Error fetching device for ${source.name}:`, fetchError);
            throw fetchError;
          }

          if (existingDevices && existingDevices.length > 0) {
            console.log(`Device exists for ${source.name}:`, existingDevices[0].id);
            return { ...source, deviceId: existingDevices[0].id };
          }

          console.log(`Creating new device for ${source.name}`);
          const { data: newDevice, error: createError } = await supabase
            .from('plc_devices')
            .insert({
              name: source.name,
              description: `Data source for ${source.name}`,
              owner_id: userId,
              is_active: true,
              protocol: 'modbus'
            })
            .select()
            .single();

          if (createError) {
            console.error(`Error creating device for ${source.name}:`, createError);
            throw createError;
          }

          console.log(`Created new device for ${source.name}:`, newDevice.id);
          return { ...source, deviceId: newDevice.id };
        } catch (error) {
          console.error(`Error setting up device for ${source.name}:`, error);
          toast.error(`Failed to setup ${source.name}`);
          return source;
        }
      })
    );

    return updatedSources;
  } catch (error) {
    console.error('Error initializing devices:', error);
    toast.error('Failed to initialize devices');
    return initialSources;
  }
};