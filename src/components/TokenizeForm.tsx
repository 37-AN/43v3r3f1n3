import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TokenizeFormData } from "@/types/tokenize";
import { initializeBlockchainConnection } from "@/utils/blockchain/tokenization";
import { toast } from "sonner";

interface TokenizeFormProps {
  formData: TokenizeFormData;
  setFormData: (data: TokenizeFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function TokenizeForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  isSubmitting, 
  onCancel 
}: TokenizeFormProps) {
  const handleConnectWallet = async () => {
    const connection = await initializeBlockchainConnection();
    if (connection) {
      toast.success('Wallet connected successfully');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Asset Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter asset name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter asset description"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="assetType">Asset Type</Label>
        <Select 
          value={formData.assetType} 
          onValueChange={(value) => setFormData({ ...formData, assetType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select asset type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="machine">Machine</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tokenSymbol">Token Symbol</Label>
        <Input
          id="tokenSymbol"
          value={formData.tokenSymbol}
          onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })}
          placeholder="e.g., MACH1"
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
            onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, pricePerToken: e.target.value })}
            min="0.000001"
            step="0.000001"
            required
          />
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleConnectWallet}
      >
        Connect Wallet
      </Button>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Token'}
        </Button>
      </div>
    </form>
  );
}