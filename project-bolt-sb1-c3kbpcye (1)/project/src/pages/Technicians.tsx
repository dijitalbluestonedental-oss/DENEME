import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Target, 
  TrendingUp, 
  User,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function Technicians() {
  const { user } = useAuth();
  const { technicians, addTechnician, updateTechnician } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    monthlyQuota: 0,
    salary: 0,
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTechnician) {
      updateTechnician(editingTechnician.id, formData);
      setEditingTechnician(null);
    } else {
      addTechnician({
        ...formData,
        completedJobs: 0
      });
    }
    setFormData({
      name: '',
      username: '',
      monthlyQuota: 0,
      salary: 0,
      isActive: true
    });
    setShowAddModal(false);
  };

  const handleEdit = (technician) => {
    setEditingTechnician(technician);
    setFormData({
      name: technician.name,
      username: technician.username,
      monthlyQuota: technician.monthlyQuota,
      salary: technician.salary,
      isActive: technician.isActive
    });
    setShowAddModal(true);
  };

  const getPerformanceColor = (completed: number, quota: number) => {
    const percentage = (completed / quota) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBarColor = (completed: number, quota: number) => {
    const percentage = (completed / quota) * 100;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teknisyen Yönetimi</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Teknisyen performansını yönetin ve takip edin
          </p>
        </div>
        
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Teknisyen
          </button>
        )}
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Teknisyen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{technicians.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Teknisyen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {technicians.filter(t => t.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Target className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Hedef</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(technicians.reduce((sum, t) => sum + t.monthlyQuota, 0) / technicians.length || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Tamamlanan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {technicians.reduce((sum, t) => sum + t.completedJobs, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {technicians.map((technician) => {
          const completionPercentage = Math.min((technician.completedJobs / technician.monthlyQuota) * 100, 100);
          
          return (
            <div key={technician.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-medium">
                      {technician.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {technician.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{technician.username}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    technician.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {technician.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                  
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleEdit(technician)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Performance Stats */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Aylık Performans
                    </span>
                    <span className={`text-sm font-medium ${getPerformanceColor(technician.completedJobs, technician.monthlyQuota)}`}>
                      {technician.completedJobs} / {technician.monthlyQuota} ({Math.round(completionPercentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPerformanceBarColor(technician.completedJobs, technician.monthlyQuota)}`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Maaş</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₺{technician.salary.toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Aylık Hedef</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {technician.monthlyQuota} adet
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingTechnician ? 'Teknisyen Düzenle' : 'Yeni Teknisyen Ekle'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Aylık Hedef (Adet)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.monthlyQuota}
                  onChange={(e) => setFormData({ ...formData, monthlyQuota: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Maaş (₺)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Aktif Teknisyen
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTechnician(null);
                    setFormData({
                      name: '',
                      username: '',
                      monthlyQuota: 0,
                      salary: 0,
                      isActive: true
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTechnician ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}