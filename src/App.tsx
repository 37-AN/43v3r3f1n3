import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import TokenizedAssets from './pages/TokenizedAssets';
import AssetManagement from './pages/AssetManagement';
import Login from './pages/Login';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsoleProvider } from '@/contexts/ConsoleContext';
import { Web3Provider } from '@/contexts/Web3Context';
import { useAuthState } from './hooks/useAuthState';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthState();
  
  if (isAuthenticated === null) {
    // Still loading auth state
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConsoleProvider>
        <Router>
          <Web3Provider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tokenized-assets"
                element={
                  <ProtectedRoute>
                    <TokenizedAssets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/asset-management"
                element={
                  <ProtectedRoute>
                    <AssetManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <div>Tasks Coming Soon</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quality-review"
                element={
                  <ProtectedRoute>
                    <div>Quality Review Coming Soon</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute>
                    <div>Progress Coming Soon</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster />
          </Web3Provider>
        </Router>
      </ConsoleProvider>
    </QueryClientProvider>
  );
}

export default App;