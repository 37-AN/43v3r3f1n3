import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import TokenizedAssets from "./pages/TokenizedAssets";
import { useAuthState } from "@/hooks/useAuthState";
import { usePLCData } from "@/hooks/usePLCData";

const queryClient = new QueryClient();

const App = () => {
  const isAuthenticated = useAuthState();
  const { plcData, connectionStatus } = usePLCData(isAuthenticated || false);

  if (isAuthenticated === null) {
    return null; // Initial loading state
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Index />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <Login />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/tokenized-assets"
              element={
                isAuthenticated ? (
                  <TokenizedAssets />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;