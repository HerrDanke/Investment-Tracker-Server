import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Transactions from './pages/Transactions';
import Tags from './pages/Tags';
import Users from './pages/Users';
import Login from './pages/Login';
import { DataModal } from './components/DataModal';

function ProtectedRoutes() {
  const { user, loading, isAdmin } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDataModal, setShowDataModal] = useState(false);

  const refreshAll = useCallback(() => setRefreshKey(k => k + 1), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout onDataClick={() => setShowDataModal(true)} />}>
          <Route index element={<Dashboard key={refreshKey} />} />
          <Route path="assets" element={<Assets key={refreshKey} />} />
          <Route path="transactions" element={<Transactions key={refreshKey} />} />
          <Route path="tags" element={<Tags key={refreshKey} />} />
          <Route path="users" element={isAdmin ? <Users key={refreshKey} /> : <Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
      </Routes>
      <DataModal open={showDataModal} onClose={() => setShowDataModal(false)} onImportSuccess={refreshAll} />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicLogin />} />
      <Route path="*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

function PublicLogin() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
