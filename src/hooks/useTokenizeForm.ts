import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TokenizeFormData } from "@/types/tokenize";

export function useTokenizeForm(onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TokenizeFormData>({
    name: '',
    description: '',
    tokenSymbol: '',
    totalSupply: '1000000',
    pricePerToken: '0.001',
    assetType: 'machine'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        toast.error('Please sign in to tokenize assets');
        return;
      }

      console.log('Creating asset with data:', {
        asset_type: formData.assetType,
        name: formData.name,
        description: formData.description,
        token_symbol: formData.tokenSymbol,
        total_supply: Number(formData.totalSupply),
        price_per_token: Number(formData.pricePerToken),
        owner_id: session.session.user.id,
        metadata: {
          created_at: new Date().toISOString(),
          status: 'active',
          blockchain_network: 'testnet'
        }
      });

      const { data, error } = await supabase
        .from('tokenized_assets')
        .insert({
          asset_type: formData.assetType,
          name: formData.name,
          description: formData.description,
          token_symbol: formData.tokenSymbol,
          total_supply: Number(formData.totalSupply),
          price_per_token: Number(formData.pricePerToken),
          owner_id: session.session.user.id,
          metadata: {
            created_at: new Date().toISOString(),
            status: 'active',
            blockchain_network: 'testnet'
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating asset:', error);
        throw error;
      }

      console.log('Asset tokenized successfully:', data);
      toast.success('Asset tokenized successfully');
      onSuccess();
    } catch (error) {
      console.error('Error tokenizing asset:', error);
      toast.error('Failed to tokenize asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit
  };
}