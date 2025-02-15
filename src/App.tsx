
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import TokenizedAssets from './pages/TokenizedAssets';
import AssetManagement from './pages/AssetManagement';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsoleProvider } from '@/contexts/ConsoleContext';
import { SimulationProvider } from '@/contexts/SimulationContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConsoleProvider>
        <Router>
          <SimulationProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tokenized-assets" element={<TokenizedAssets />} />
              <Route path="/asset-management" element={<AssetManagement />} />
              <Route path="/tasks" element={<div>Tasks Coming Soon</div>} />
              <Route path="/quality-review" element={<div>Quality Review Coming Soon</div>} />
              <Route path="/progress" element={<div>Progress Coming Soon</div>} />
            </Routes>
            <Toaster />
          </SimulationProvider>
        </Router>
      </ConsoleProvider>
    </QueryClientProvider>
  );
}

export default App;
