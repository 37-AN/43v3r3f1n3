import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResourceAllocationDialog } from '@/components/asset/ResourceAllocationDialog';
import { toast } from 'sonner';
import { TokenizedAsset } from '@/types/tokenize';
import { checkCompliance } from '@/utils/blockchain/tokenization';

export default function AssetManagement() {
  const navigate = useNavigate();
  const [selectedAsset, setSelectedAsset] = React.useState<TokenizedAsset | null>(null);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = React.useState(false);

  const { data: assets, isLoading } = useQuery({
    queryKey: ['tokenized-assets'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('tokenized_assets')
        .select('*')
        .eq('owner_id', session.session.user.id);

      if (error) throw error;

      // Convert snake_case to camelCase
      return data.map((asset): TokenizedAsset => ({
        id: asset.id,
        name: asset.name,
        description: asset.description || '',
        tokenSymbol: asset.token_symbol,
        totalSupply: asset.total_supply,
        pricePerToken: asset.price_per_token,
        assetType: asset.asset_type,
        metadata: asset.metadata,
        created_at: asset.created_at
      }));
    },
  });

  const handleAllocateResources = async (asset: TokenizedAsset) => {
    try {
      const isCompliant = await checkCompliance(asset.tokenSymbol);
      if (!isCompliant) {
        toast.error('Asset is not compliant. Cannot allocate resources.');
        return;
      }
      setSelectedAsset(asset);
      setIsAllocationDialogOpen(true);
    } catch (error) {
      console.error('Error checking compliance:', error);
      toast.error('Failed to check asset compliance status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-6">Asset Management</h1>
          
          {isLoading ? (
            <p className="text-gray-500">Loading assets...</p>
          ) : assets && assets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <Card key={asset.id} className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{asset.name}</h3>
                    <p className="text-sm text-gray-500">{asset.description}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Symbol:</span>
                      <span className="font-mono">{asset.tokenSymbol}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Supply:</span>
                      <span>{asset.totalSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Price per Token:</span>
                      <span>${asset.pricePerToken}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => handleAllocateResources(asset)}
                  >
                    Allocate Resources
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tokenized assets found.</p>
          )}
        </div>
      </div>

      {selectedAsset && (
        <ResourceAllocationDialog
          asset={selectedAsset}
          open={isAllocationDialogOpen}
          onOpenChange={setIsAllocationDialogOpen}
        />
      )}
    </div>
  );
}