import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TokenizeDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TokenizeDeviceDialog({ open, onOpenChange, onSuccess }: TokenizeDeviceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tokenSymbol: '',
    totalSupply: '1000000',
    pricePerToken: '0.001'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('tokenized_assets')
        .insert([
          {
            asset_type: 'device',
            name: formData.name,
            description: formData.description,
            token_symbol: formData.tokenSymbol,
            total_supply: formData.totalSupply,
            price_per_token: formData.pricePerToken,
            owner_id: userData.user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('Asset tokenized successfully:', data);
      toast.success('Asset tokenized successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error tokenizing asset:', error);
      toast.error('Failed to tokenize asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tokenize Industrial Asset</DialogTitle>
          <DialogDescription>
            Create a new tokenized asset to enable secure data sharing and monetization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter asset name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter asset description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tokenSymbol">Token Symbol</Label>
            <Input
              id="tokenSymbol"
              value={formData.tokenSymbol}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenSymbol: e.target.value }))}
              placeholder="e.g., PLCA1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalSupply">Total Supply</Label>
              <Input
                id="totalSupply"
                type="number"
                value={formData.totalSupply}
                onChange={(e) => setFormData(prev => ({ ...prev, totalSupply: e.target.value }))}
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerToken">Price per Token</Label>
              <Input
                id="pricePerToken"
                type="number"
                value={formData.pricePerToken}
                onChange={(e) => setFormData(prev => ({ ...prev, pricePerToken: e.target.value }))}
                min="0.000001"
                step="0.000001"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Token'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}