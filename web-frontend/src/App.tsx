import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Transactions from './pages/Transactions';
import Tags from './pages/Tags';
import { DataModal } from './components/DataModal';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDataModal, setShowDataModal] = useState(false);

  const refreshAll = useCallback(() => setRefreshKey(k => k + 1), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout onDataClick={() => setShowDataModal(true)} />}>
          <Route index element={<Dashboard key={refreshKey} />} />
          <Route path="assets" element={<Assets key={refreshKey} />} />
          <Route path="transactions" element={<Transactions key={refreshKey} />} />
          <Route path="tags" element={<Tags key={refreshKey} />} />
        </Route>
      </Routes>
      <DataModal open={showDataModal} onClose={() => setShowDataModal(false)} onImportSuccess={refreshAll} />
    </BrowserRouter>
  );
}
