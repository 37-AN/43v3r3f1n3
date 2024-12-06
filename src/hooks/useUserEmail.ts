import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserEmail = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        console.log("Current user email:", user.email);
        setUserEmail(user.email);
      }
    });
  }, []);

  return userEmail;
};