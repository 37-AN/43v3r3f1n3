import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Login from "./pages/Login";
import TokenizedAssets from "./pages/TokenizedAssets";
import ComplianceMonitoring from "./pages/ComplianceMonitoring";
import { useAuthState } from "@/hooks/useAuthState";
import { usePLCData } from "@/hooks/usePLCData";
import { ConsoleProvider } from "@/contexts/ConsoleContext";
import { Console } from "@/components/Console";
import { useConsole } from "@/contexts/ConsoleContext";

const queryClient = new QueryClient();

const ConsoleWrapper = () => {
  const { messages } = useConsole();
  return <Console messages={messages} />;
};

const App = () => {
  const isAuthenticated = useAuthState();
  const { plcData, connectionStatus } = usePLCData(isAuthenticated || false);

  if (isAuthenticated === null) {
    return null; // Initial loading state
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ConsoleProvider>
        <BrowserRouter>
          <TooltipProvider>
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
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
                  <Route
                    path="/compliance-monitoring"
                    element={
                      isAuthenticated ? (
                        <ComplianceMonitoring />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    }
                  />
                </Routes>
              </div>
              <div className="fixed bottom-0 left-0 right-0 z-50 p-2 max-w-lg mx-auto">
                <ConsoleWrapper />
              </div>
            </div>
          </TooltipProvider>
        </BrowserRouter>
      </ConsoleProvider>
    </QueryClientProvider>
  );
};

export default App;