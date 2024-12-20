import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TokenizedAssetsListProps {
  assets: any[];
}

export const TokenizedAssetsList = ({ assets }: TokenizedAssetsListProps) => {
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {assets && assets.length > 0 ? (
          assets.map((asset) => (
            <div
              key={asset.id}
              className="p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{asset.name}</p>
                <Badge>{asset.token_symbol}</Badge>
              </div>
              <div className="text-sm text-gray-500">
                <p>Supply: {asset.total_supply.toLocaleString()}</p>
                <p>Price: ${asset.price_per_token}</p>
                <p className="mt-1 text-xs">
                  Created: {new Date(asset.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No tokenized assets found
          </p>
        )}
      </div>
    </ScrollArea>
  );
};