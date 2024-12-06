import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTokenizedAssets = () => {
  const [tokenizedAssets, setTokenizedAssets] = useState([]);
  const [isTokenizeDialogOpen, setIsTokenizeDialogOpen] = useState(false);

  const fetchTokenizedAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('tokenized_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokenizedAssets(data);
      console.log('Fetched tokenized assets:', data);
    } catch (error) {
      console.error('Error fetching tokenized assets:', error);
      toast.error('Failed to load tokenized assets');
    }
  };

  useEffect(() => {
    fetchTokenizedAssets();
  }, []);

  return {
    tokenizedAssets,
    isTokenizeDialogOpen,
    setIsTokenizeDialogOpen,
    fetchTokenizedAssets
  };
};