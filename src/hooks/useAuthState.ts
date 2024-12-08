import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial auth check:", session ? "authenticated" : "not authenticated");
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session ? "authenticated" : "not authenticated");
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return isAuthenticated;
};