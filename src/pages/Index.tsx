import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, List, Eye, Database } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthState();

  React.useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleCreateDataset = () => {
    toast.info('Coming soon: Dataset creation');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Data Annotation Platform</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Annotate, validate, and improve your AI training datasets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <List className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold">Annotation Tasks</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Start annotating datasets with our intuitive tools
            </p>
            <Button 
              className="w-full"
              onClick={() => navigate('/tasks')}
            >
              View Tasks
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-semibold">Quality Assurance</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Review and validate annotations for accuracy
            </p>
            <Button 
              className="w-full"
              onClick={() => navigate('/quality-review')}
            >
              Review Annotations
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Database className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-semibold">Datasets</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Manage and monitor your datasets
            </p>
            <Button 
              className="w-full"
              onClick={handleCreateDataset}
            >
              Create Dataset
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Eye className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-semibold">Review Progress</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Track annotation progress and team performance
            </p>
            <Button 
              className="w-full"
              onClick={() => navigate('/progress')}
            >
              View Progress
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;