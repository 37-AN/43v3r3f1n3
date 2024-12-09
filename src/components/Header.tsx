import { Button } from "@/components/ui/button";
import { PlusCircle, List } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  isProcessing: boolean;
  onTokenizeClick: () => void;
}

export const Header = ({ isProcessing, onTokenizeClick }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="animate-fade-up flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-semibold text-system-gray-900">Industrial Data Refinement</h1>
        <p className="text-system-gray-500 mt-2">Real-time monitoring and tokenized data management</p>
        {isProcessing && (
          <p className="text-sm text-system-gray-400 mt-1">Processing data with AI models...</p>
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
      </div>
    </header>
  );
};