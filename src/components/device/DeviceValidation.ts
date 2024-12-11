import { toast } from "sonner";

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateDeviceAccess = async (supabase: any, deviceId: string) => {
  if (!isValidUUID(deviceId)) {
    console.error('Invalid device ID format:', deviceId);
    toast.error('Invalid device ID format');
    return false;
  }

  try {
    const { data: device, error } = await supabase
      .from('plc_devices')
      .select('id, owner_id')
      .eq('id', deviceId)
      .single();

    if (error) {
      console.error('Error checking device access:', error);
      toast.error('Error checking device access');
      return false;
    }

    if (!device) {
      console.error('Device not found or no access');
      toast.error('Device not found or no access');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in device validation:', error);
    toast.error('Failed to validate device access');
    return false;
  }
};