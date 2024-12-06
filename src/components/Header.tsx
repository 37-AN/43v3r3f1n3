import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HeaderProps {
  userEmail: string | null;
  isProcessing: boolean;
  onTokenizeClick: () => void;
}

export const Header = ({ userEmail, isProcessing, onTokenizeClick }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      console.log("User logged out successfully");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <header className="animate-fade-up flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-semibold text-system-gray-900">Industrial Data Refinement</h1>
        <p className="text-system-gray-500 mt-2">Real-time monitoring and tokenized data management</p>
        {isProcessing && (
          <p className="text-sm text-system-gray-400 mt-1">Processing data with AI models...</p>
        )}
        {userEmail && (
          <p className="text-sm text-system-gray-400 mt-1">Logged in as: {userEmail}</p>
        )}
      </div>
      <div className="flex gap-4">
        <Button
          onClick={() => navigate('/tokenized-assets')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <List className="w-4 h-4" />
          View Assets
        </Button>
        <Button
          onClick={onTokenizeClick}
          className="flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Tokenize Asset
        </Button>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </header>
  );
};