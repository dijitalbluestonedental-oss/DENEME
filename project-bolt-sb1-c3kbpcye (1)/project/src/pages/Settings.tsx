import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2, 
  User, 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  Settings as SettingsIcon,
  DollarSign
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { 
    clinics, 
    doctors, 
    prosthesisTypes, 
    addClinic, 
    addDoctor, 
    addProsthesisType,
    updateProsthesisType
  } = useData();

  const [activeTab, setActiveTab] = useState('clinics');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingProsthesis, setEditingProsthesis] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    clinicId: '',
    basePrice: 0,
    modelPrice: 0,
    category: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    switch (modalType) {
      case 'clinic':
        addClinic({ name: formData.name });
        break;
      case 'doctor':
        addDoctor({ name: formData.name, clinicId: formData.clinicId });
        break;
      case 'prosthesis':
        if (editingProsthesis) {
          updateProsthesisType(editingProsthesis.id, {
            name: formData.name,
            basePrice: formData.basePrice,
            modelPrice: formData.modelPrice,
            category: formData.category
          });
          setEditingProsthesis(null);
        } else {
          addProsthesisType({
            name: formData.name,
            basePrice: formData.basePrice,
            modelPrice: formData.modelPrice,
            category: formData.category
          });
        }
        break;
    }
    
    setFormData({ name: '', clinicId: '', basePrice: 0, modelPrice: 0, category: '' });
    setShowAddModal(false);
    setModalType('');
  };

  const openAddModal = (type: string) => {
    setModalType(type);
    setShowAddModal(true);
  };

  const handleEditProsthesis = (prosthesis) => {
    setEditingProsthesis(prosthesis);
    setFormData({
      name: prosthesis.name,
      clinicId: '',
      basePrice: prosthesis.basePrice,
      modelPrice: prosthesis.modelPrice || 0,
      category: prosthesis.category || ''
    });
    setModalType('prosthesis');
    setShowAddModal(true);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <SettingsIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Erişim Reddedildi
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ayarlar sayfasına sadece yöneticiler erişebilir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Sistem ayarlarını yönetin
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('clinics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clinics'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Building2 className="h-5 w-5 mr-2 inline" />
              Klinikler & Hekimler
            </button>
            <button
              onClick={() => setActiveTab('prosthesis')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prosthesis'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Package className="h-5 w-5 mr-2 inline" />
              Protez Türleri
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'clinics' && (
            <div className="space-y-8">
              {/* Clinics Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Klinikler
                  </h3>
                  <button
                    onClick={() => openAddModal('clinic')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Klinik Ekle
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clinics.map((clinic) => (
                    <div key={clinic.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {clinic.name}
                        </h4>
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Hekimler:
                          </span>
                          <button
                            onClick={() => openAddModal('doctor')}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-1">
                          {doctors
                            .filter(doctor => doctor.clinicId === clinic.id)
                            .map(doctor => (
                              <div key={doctor.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700 dark:text-gray-300">
                                  {doctor.name}
                                </span>
                                <button className="text-gray-400 hover:text-red-600">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Doctors List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tüm Hekimler
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-100 dark:bg-gray-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Hekim Adı
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Klinik
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {doctors.map((doctor) => {
                        const clinic = clinics.find(c => c.id === doctor.clinicId);
                        return (
                          <tr key={doctor.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {doctor.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                              {clinic?.name || 'Klinik bulunamadı'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prosthesis' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Protez Türleri ve Fiyatları
                </h3>
                <button
                  onClick={() => openAddModal('prosthesis')}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Protez Türü Ekle
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prosthesisTypes.map((prosthesis) => (
                  <div key={prosthesis.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {prosthesis.name}
                      </h4>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditProsthesis(prosthesis)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Temel Fiyat:</span>
                        <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          ₺{prosthesis.basePrice.toLocaleString('tr-TR')}
                        </span>
                      </div>
                      {prosthesis.modelPrice && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Model Fiyatı:</span>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            ₺{prosthesis.modelPrice.toLocaleString('tr-TR')}
                          </span>
                        </div>
                      )}
                      {prosthesis.category && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {prosthesis.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {modalType === 'clinic' ? 'Yeni Klinik Ekle' :
               modalType === 'doctor' ? 'Yeni Hekim Ekle' :
               editingProsthesis ? 'Protez Türü Düzenle' : 'Yeni Protez Türü Ekle'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {modalType === 'clinic' ? 'Klinik Adı' :
                   modalType === 'doctor' ? 'Hekim Adı' :
                   'Protez Türü Adı'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {modalType === 'doctor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Klinik *
                  </label>
                  <select
                    required
                    value={formData.clinicId}
                    onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Klinik Seçin</option>
                    {clinics.map(clinic => (
                      <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {modalType === 'prosthesis' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kategori
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Örn: Kuron, Protez, İmplant"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Temel Fiyat (₺) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Model Fiyatı (₺)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.modelPrice}
                      onChange={(e) => setFormData({ ...formData, modelPrice: parseInt(e.target.value) })}
                      placeholder="Model eklendiğinde ek ücret"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setModalType('');
                    setEditingProsthesis(null);
                    setFormData({ name: '', clinicId: '', basePrice: 0, modelPrice: 0, category: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProsthesis ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}