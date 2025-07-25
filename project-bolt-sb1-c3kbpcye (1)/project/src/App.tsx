import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import WorkSchedule from './pages/WorkSchedule';
import Technicians from './pages/Technicians';
import Accounting from './pages/Accounting';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import Clients from './pages/Clients';
import Expenses from './pages/Expenses';

import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

function InnerApp() {
  const { isLoading } = useData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Veriler yükleniyor..." />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/giris" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/siparisler" element={<Orders />} />
          <Route path="/is-takvimi" element={<WorkSchedule />} />
          <Route path="/teknisyenler" element={<Technicians />} />
          <Route path="/muhasebe" element={<Accounting />} />
          <Route path="/cariler" element={<Clients />} />
          <Route path="/giderler" element={<Expenses />} />
          <Route path="/kullanicilar" element={<UserManagement />} />
          <Route path="/ayarlar" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <InnerApp />
        </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;