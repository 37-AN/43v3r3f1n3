import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { checkCompliance } from '@/utils/blockchain/tokenization';
import { toast } from 'sonner';

const ComplianceMonitoring = () => {
  const navigate = useNavigate();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['tokenized-assets-compliance'],
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

      // Check compliance status for each asset
      const assetsWithCompliance = await Promise.all(
        data.map(async (asset) => {
          try {
            const isCompliant = await checkCompliance(asset.token_symbol);
            return { ...asset, isCompliant };
          } catch (error) {
            console.error(`Error checking compliance for ${asset.token_symbol}:`, error);
            return { ...asset, isCompliant: false };
          }
        })
      );

      return assetsWithCompliance;
    },
  });

  const handleRefreshCompliance = async (symbol: string) => {
    try {
      const isCompliant = await checkCompliance(symbol);
      toast.success(`Compliance status updated: ${isCompliant ? 'Compliant' : 'Non-compliant'}`);
    } catch (error) {
      console.error('Error refreshing compliance:', error);
      toast.error('Failed to refresh compliance status');
    }
  };

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
          <h1 className="text-3xl font-semibold text-system-gray-900 mb-6">Compliance Monitoring</h1>
          
          {isLoading ? (
            <p className="text-system-gray-500">Loading compliance data...</p>
          ) : assets && assets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Token Symbol</TableHead>
                  <TableHead>Compliance Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.token_symbol}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        asset.isCompliant 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {asset.isCompliant ? 'Compliant' : 'Non-compliant'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshCompliance(asset.token_symbol)}
                      >
                        Refresh Status
                      </Button>
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

export default ComplianceMonitoring;