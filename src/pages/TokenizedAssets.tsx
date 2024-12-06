import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TokenizedAssets = () => {
  const navigate = useNavigate();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['tokenized-assets'],
    queryFn: async () => {
      console.log('Fetching tokenized assets...');
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('tokenized_assets')
        .select('*')
        .eq('owner_id', session.session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assets:', error);
        throw error;
      }

      console.log('Fetched assets:', data);
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-system-gray-50 p-8">
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
          <h1 className="text-3xl font-semibold text-system-gray-900 mb-6">Your Tokenized Assets</h1>
          
          {isLoading ? (
            <p className="text-system-gray-500">Loading assets...</p>
          ) : assets && assets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Token Symbol</TableHead>
                  <TableHead>Total Supply</TableHead>
                  <TableHead>Price per Token</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.asset_type}</TableCell>
                    <TableCell>{asset.token_symbol}</TableCell>
                    <TableCell>{asset.total_supply.toLocaleString()}</TableCell>
                    <TableCell>${asset.price_per_token}</TableCell>
                    <TableCell>
                      {new Date(asset.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-system-gray-500">No tokenized assets found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenizedAssets;