import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import Predictions from './pages/Predictions';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh', background: '#060c1a',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#6366f1', fontSize: '18px',
  }}>
    Loading...
  </div>
);

// Login nahi hai to /login pe bhejo
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Customer try kare to /dashboard pe bhejo
const AdminOnlyRoute = ({ children }) => {
  const { isAdmin, isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

// Pehle se logged in hai to /dashboard pe bhejo
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const Layout = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh', background: '#060c1a' }}>
    <Sidebar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      <Header />
      <main style={{ flex: 1, overflowY: 'auto', padding: '26px 30px' }}>
        {children}
      </main>
    </div>
  </div>
);

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes — sirf tabhi dikhenge jab logged out ho */}
        <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* Protected Routes — login zaroori */}
        <Route path="/"          element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/medicines" element={<ProtectedRoute><Layout><Medicines /></Layout></ProtectedRoute>} />
        <Route path="/settings"  element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

        {/* Admin Only Routes — customer yahan nahi ja sakta */}
        <Route path="/predictions" element={<AdminOnlyRoute><Layout><Predictions /></Layout></AdminOnlyRoute>} />
        <Route path="/alerts"      element={<AdminOnlyRoute><Layout><Alerts /></Layout></AdminOnlyRoute>} />
        <Route path="/admin"       element={<AdminOnlyRoute><AdminDashboard /></AdminOnlyRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  );
}