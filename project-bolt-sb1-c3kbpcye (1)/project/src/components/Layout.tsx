import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from './LoadingSpinner';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Calculator, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  Bluetooth as Tooth,
  UserCheck,
  Building2,
  Receipt,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { loading, error, refreshData } = useData();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/giris');
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  const navigation = [
    { name: 'Kontrol Paneli', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Siparişler', href: '/siparisler', icon: Package },
    { name: 'Teknisyenler', href: '/teknisyenler', icon: Users },
    { name: 'Muhasebe', href: '/muhasebe', icon: Calculator },
    { name: 'Cariler', href: '/cariler', icon: Building2 },
    { name: 'Giderler', href: '/giderler', icon: Receipt },
    { name: 'Kullanıcılar', href: '/kullanicilar', icon: UserCheck },
    { name: 'Ayarlar', href: '/ayarlar', icon: Settings },
  ];

  // Role-based navigation filtering
  const filteredNavigation = navigation.filter(item => {
    if (user?.role === 'technician') {
      return ['Kontrol Paneli', 'Siparişler'].includes(item.name);
    }
    if (user?.role === 'accountant') {
      return ['Kontrol Paneli', 'Muhasebe', 'Cariler', 'Giderler'].includes(item.name);
    }
    return true; // Admin can see all
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Veriler yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium"
            >
              Yeniden Dene
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Tooth className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  BlueStone Lab
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Protez Takip Sistemi
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {user?.photo ? (
                  <img 
                    src={user.photo} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role === 'admin' ? 'Yönetici' : 
                     user?.role === 'technician' ? 'Teknisyen' : 'Muhasebeci'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Tema Değiştir"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                
                <button
                  onClick={handleRefresh}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Verileri Yenile"
                  disabled={loading}
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}