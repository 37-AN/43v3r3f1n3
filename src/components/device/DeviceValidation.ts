
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Simplified validation that only checks if device exists
export const validateDeviceAccess = async (supabase: any, deviceId: string) => {
  try {
    const { data: device, error } = await supabase
      .from('plc_devices')
      .select('id')
      .eq('id', deviceId)
      .single();

    return !!device;
  } catch (error) {
    console.error('Error in device validation:', error);
    return false;
  }
};
