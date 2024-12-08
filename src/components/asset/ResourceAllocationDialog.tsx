import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TokenizedAsset } from '@/types/tokenize';
import { allocateResource } from '@/utils/blockchain/tokenization';

interface ResourceAllocationDialogProps {
  asset: TokenizedAsset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResourceAllocationDialog({ 
  asset, 
  open, 
  onOpenChange 
}: ResourceAllocationDialogProps) {
  const [userAddress, setUserAddress] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [isAllocating, setIsAllocating] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAddress || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsAllocating(true);
      await allocateResource(
        asset.tokenSymbol,
        userAddress,
        parseFloat(amount)
      );
      toast.success('Resources allocated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error allocating resources:', error);
      toast.error('Failed to allocate resources');
    } finally {
      setIsAllocating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Allocate Resources</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userAddress">User Address</Label>
            <Input
              id="userAddress"
              placeholder="0x..."
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isAllocating}
            >
              {isAllocating ? 'Allocating...' : 'Allocate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}