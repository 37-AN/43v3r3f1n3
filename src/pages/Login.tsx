import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        console.log("User is authenticated, redirecting to home");
        navigate("/");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-system-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold text-center mb-6">Welcome Back</h1>
        <div className="space-y-4">
          <p className="text-center text-gray-600">
            Please sign in to continue
          </p>
          {/* Temporarily remove Auth component until dependencies are properly set up */}
        </div>
      </div>
    </div>
  );
}