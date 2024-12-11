import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTokenizedAssets = (deviceId?: string) => {
  const [tokenizedAssets, setTokenizedAssets] = useState([]);
  const [isTokenizeDialogOpen, setIsTokenizeDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTokenizedAssets = async () => {
    try {
      console.log('Fetching tokenized assets for device:', deviceId);
      let query = supabase
        .from('tokenized_assets')
        .select('*');

      // Only apply device_id filter if provided
      if (deviceId) {
        // Use proper JSON containment syntax with object
        query = query.contains('metadata', { device_id: deviceId });
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tokenized assets:', error);
        toast.error('Failed to load tokenized assets');
        return;
      }

      console.log('Fetched tokenized assets:', data);
      setTokenizedAssets(data || []);
    } catch (error) {
      console.error('Error in fetchTokenizedAssets:', error);
      toast.error('Failed to load tokenized assets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenizedAssets();
  }, [deviceId]);

  return {
    tokenizedAssets,
    isTokenizeDialogOpen,
    setIsTokenizeDialogOpen,
    fetchTokenizedAssets,
    isLoading
  };
};