import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import TokenizedAssets from './pages/TokenizedAssets';
import AssetManagement from './pages/AssetManagement';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/tokenized-assets" element={<TokenizedAssets />} />
        <Route path="/asset-management" element={<AssetManagement />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;