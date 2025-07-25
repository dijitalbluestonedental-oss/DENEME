import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, Download, Calendar, User, Package, Eye, Edit, Users, Smartphone, FileText, Hand, CheckCircle, Cuboid as Cube } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Orders() {
  const { user } = useAuth();
  const { 
    orders, 
    doctors, 
    prosthesisTypes, 
    technicians, 
    addOrder, 
    updateOrder,
    getDoctorById,
    getProsthesisTypeById,
    getTechnicianById
  } = useData();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryData, setDeliveryData] = useState({
    unitCount: 0,
    actualDeliveryDate: new Date().toISOString().split('T')[0],
    hasModel: false
  });
  const [formData, setFormData] = useState({
    patientName: '',
    doctorId: '',
    prosthesisTypeId: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    unitCount: 1,
    notes: '',
    isDigitalMeasurement: false,
    isManualMeasurement: false
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const prosthesis = getProsthesisTypeById(formData.prosthesisTypeId);
    
    // Sadece temel fiyat hesaplama: üye sayısı × birim fiyat
    const totalPrice = (prosthesis?.basePrice || 0) * formData.unitCount;
    
    addOrder({
      ...formData,
      status: 'waiting',
      totalPrice,
      isPaid: false,
      hasModel: false // Başlangıçta model yok
    });
    setFormData({
      patientName: '',
      doctorId: '',
      prosthesisTypeId: '',
      arrivalDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      unitCount: 1,
      notes: '',
      isDigitalMeasurement: false,
      isManualMeasurement: false
    });
    setShowAddModal(false);
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    if (newStatus === 'delivered') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setDeliveryData({
          unitCount: order.unitCount,
          actualDeliveryDate: new Date().toISOString().split('T')[0],
          hasModel: false
        });
        setShowDeliveryModal(true);
      }
      return;
    }

    const updates: any = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completionDate = new Date().toISOString();
    }
    updateOrder(orderId, updates);
  };

  const handleDeliveryConfirm = () => {
    if (selectedOrder) {
      const prosthesis = getProsthesisTypeById(selectedOrder.prosthesisTypeId);
      
      // Temel fiyat hesaplama
      let finalPrice = (prosthesis?.basePrice || 0) * deliveryData.unitCount;
      
      // Model fiyatı: SABİT ÜCRET (sadece model teslim edilirse eklenir)
      if (deliveryData.hasModel && prosthesis?.modelPrice) {
        finalPrice += prosthesis.modelPrice;
      }
      
      updateOrder(selectedOrder.id, {
        status: 'delivered',
        unitCount: deliveryData.unitCount,
        actualDeliveryDate: deliveryData.actualDeliveryDate,
        hasModel: deliveryData.hasModel,
        finalPrice: finalPrice
      });
    }
    setShowDeliveryModal(false);
    setSelectedOrder(null);
  };

  const exportToExcel = () => {
    const exportData = filteredOrders.map(order => ({
      'Hasta Adı': order.patientName,
      'Hekim': getDoctorById(order.doctorId)?.name || 'Bilinmiyor',
      'Protez Türü': getProsthesisTypeById(order.prosthesisTypeId)?.name || 'Bilinmiyor',
      'Adet': order.unitCount,
      'Dijital Ölçü': order.isDigitalMeasurement ? 'Evet' : 'Hayır',
      'Manuel Ölçü': order.isManualMeasurement ? 'Evet' : 'Hayır',
      'Model': order.hasModel ? 'Evet' : 'Hayır',
      'Birim Fiyat': user?.canViewPrices ? getProsthesisTypeById(order.prosthesisTypeId)?.basePrice : '***',
      'Toplam Fiyat': user?.canViewPrices ? (order.finalPrice || order.totalPrice) : '***',
      'Durum': order.status === 'waiting' ? 'Bekliyor' :
               order.status === 'in-progress' ? 'Devam Ediyor' :
               order.status === 'completed' ? 'Tamamlandı' : 'Teslim Edildi',
      'Geliş Tarihi': new Date(order.arrivalDate).toLocaleDateString('tr-TR'),
      'Planlanan Teslim': new Date(order.deliveryDate).toLocaleDateString('tr-TR'),
      'Gerçek Teslim': order.actualDeliveryDate ? new Date(order.actualDeliveryDate).toLocaleDateString('tr-TR') : '',
      'Teknisyen': order.technicianId ? getTechnicianById(order.technicianId)?.name : 'Atanmamış',
      'Notlar': order.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Siparişler');
    XLSX.writeFile(wb, `Siparisler_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'delivered': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Bekliyor';
      case 'in-progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      case 'delivered': return 'Teslim Edildi';
      default: return status;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sipariş Yönetimi</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Protez siparişlerini yönetin ve takip edin
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            Excel'e Aktar
          </button>
          
          {(user?.role === 'admin' || user?.role === 'technician') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Yeni Sipariş
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Hasta adı ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="waiting">Bekliyor</option>
              <option value="in-progress">Devam Ediyor</option>
              <option value="completed">Tamamlandı</option>
              <option value="delivered">Teslim Edildi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Hasta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Hekim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Protez Türü
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Adet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Özellikler
                </th>
                {user?.canViewPrices && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Toplam Fiyat
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Teslim Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.patientName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {getDoctorById(order.doctorId)?.name || 'Bilinmiyor'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {getProsthesisTypeById(order.prosthesisTypeId)?.name || 'Bilinmiyor'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {order.unitCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {order.isDigitalMeasurement && (
                        <div className="flex items-center">
                          <Smartphone className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Dijital</span>
                        </div>
                      )}
                      {order.isManualMeasurement && (
                        <div className="flex items-center">
                          <Hand className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Manuel</span>
                        </div>
                      )}
                      {!order.isDigitalMeasurement && !order.isManualMeasurement && (
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Konvansiyonel</span>
                        </div>
                      )}
                      {order.hasModel && (
                        <div className="flex items-center">
                          <Cube className="h-4 w-4 text-purple-500 mr-1" />
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Model</span>
                        </div>
                      )}
                    </div>
                  </td>
                  {user?.canViewPrices && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      ₺{(order.finalPrice || order.totalPrice).toLocaleString('tr-TR')}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Planlanan:</div>
                      <div>{new Date(order.deliveryDate).toLocaleDateString('tr-TR')}</div>
                      {order.actualDeliveryDate && (
                        <>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Gerçek:</div>
                          <div className="text-green-600 dark:text-green-400 font-medium">
                            {new Date(order.actualDeliveryDate).toLocaleDateString('tr-TR')}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {user?.role !== 'accountant' && (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="waiting">Bekliyor</option>
                          <option value="in-progress">Devam Ediyor</option>
                          <option value="completed">Tamamlandı</option>
                          <option value="delivered">Teslim Edildi</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Yeni Sipariş Ekle
            </h3>
            
            <form onSubmit={handleAddOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hasta Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hekim *
                </label>
                <select
                  required
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Hekim Seçin</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Protez Türü *
                </label>
                <select
                  required
                  value={formData.prosthesisTypeId}
                  onChange={(e) => setFormData({ ...formData, prosthesisTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Protez Türü Seçin</option>
                  {prosthesisTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} {user?.canViewPrices && `(₺${type.basePrice})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Üye Sayısı (Adet) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.unitCount}
                  onChange={(e) => setFormData({ ...formData, unitCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Geliş Tarihi *
                </label>
                <input
                  type="date"
                  required
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Planlanan Teslim Tarihi *
                </label>
                <input
                  type="date"
                  required
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDigitalMeasurement"
                    checked={formData.isDigitalMeasurement}
                    onChange={(e) => setFormData({ ...formData, isDigitalMeasurement: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDigitalMeasurement" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center">
                      <Smartphone className="h-4 w-4 mr-1 text-blue-500" />
                      Dijital Ölçü
                    </div>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isManualMeasurement"
                    checked={formData.isManualMeasurement}
                    onChange={(e) => setFormData({ ...formData, isManualMeasurement: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isManualMeasurement" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center">
                      <Hand className="h-4 w-4 mr-1 text-green-500" />
                      Manuel Ölçü
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notlar
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Özel notlar..."
                />
              </div>

              {user?.canViewPrices && formData.prosthesisTypeId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Temel Tutar:</div>
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    ₺{((getProsthesisTypeById(formData.prosthesisTypeId)?.basePrice || 0) * formData.unitCount).toLocaleString('tr-TR')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Model ücreti teslim sırasında eklenecek
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal - İrsaliye Benzeri */}
      {showDeliveryModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Package className="h-6 w-6 mr-2 text-blue-600" />
                TESLİMAT İRSALİYESİ
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Sipariş No: {selectedOrder.barcode}
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Sipariş Bilgileri */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hasta</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.patientName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hekim</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getDoctorById(selectedOrder.doctorId)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Protez Türü</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getProsthesisTypeById(selectedOrder.prosthesisTypeId)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sipariş Edilen</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.unitCount} adet</p>
                </div>
              </div>

              {/* Teslim Bilgileri */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                  TESLİM BİLGİLERİ
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teslim Edilen Adet *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedOrder.unitCount}
                    value={deliveryData.unitCount}
                    onChange={(e) => setDeliveryData({ ...deliveryData, unitCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teslim Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryData.actualDeliveryDate}
                    onChange={(e) => setDeliveryData({ ...deliveryData, actualDeliveryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Model Kontrolü */}
                <div className="p-4 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="deliveryHasModel"
                      checked={deliveryData.hasModel}
                      onChange={(e) => setDeliveryData({ ...deliveryData, hasModel: e.target.checked })}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="deliveryHasModel" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <Cube className="h-5 w-5 mr-2 text-purple-500" />
                        Model Teslim Edildi
                        {deliveryData.hasModel && user?.canViewPrices && (
                          <span className="ml-2 text-sm text-purple-600 dark:text-purple-400 font-semibold">
                            (+₺{getProsthesisTypeById(selectedOrder.prosthesisTypeId)?.modelPrice || 0})
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-8">
                    Model teslim edilirse ek ücret hesaplanacak
                  </p>
                </div>

                {/* Fiyat Özeti */}
                {user?.canViewPrices && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">FİYAT ÖZETİ</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Protez ({deliveryData.unitCount} adet):</span>
                        <span>₺{((getProsthesisTypeById(selectedOrder.prosthesisTypeId)?.basePrice || 0) * deliveryData.unitCount).toLocaleString('tr-TR')}</span>
                      </div>
                      {deliveryData.hasModel && (
                        <div className="flex justify-between text-purple-600 dark:text-purple-400">
                          <span>Model ücreti:</span>
                          <span>₺{(getProsthesisTypeById(selectedOrder.prosthesisTypeId)?.modelPrice || 0).toLocaleString('tr-TR')}</span>
                        </div>
                      )}
                      <div className="border-t border-blue-300 dark:border-blue-600 pt-1 mt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>TOPLAM:</span>
                          <span>₺{(() => {
                            const prosthesis = getProsthesisTypeById(selectedOrder.prosthesisTypeId);
                            let total = (prosthesis?.basePrice || 0) * deliveryData.unitCount;
                            if (deliveryData.hasModel && prosthesis?.modelPrice) {
                              total += prosthesis.modelPrice;
                            }
                            return total.toLocaleString('tr-TR');
                          })()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeliveryConfirm}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  TESLİM ET
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sipariş Detayları
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Durum</label>
                  <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Üye Sayısı</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedOrder.unitCount}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Hasta Adı</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedOrder.patientName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Hekim</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {getDoctorById(selectedOrder.doctorId)?.name || 'Bilinmiyor'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Protez Türü</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {getProsthesisTypeById(selectedOrder.prosthesisTypeId)?.name || 'Bilinmiyor'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Özellikler</label>
                <div className="flex items-center space-x-2 mt-1">
                  {selectedOrder.isDigitalMeasurement && (
                    <div className="flex items-center">
                      <Smartphone className="h-4 w-4 text-blue-500 mr-1" />
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Dijital</span>
                    </div>
                  )}
                  {selectedOrder.isManualMeasurement && (
                    <div className="flex items-center">
                      <Hand className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">Manuel</span>
                    </div>
                  )}
                  {!selectedOrder.isDigitalMeasurement && !selectedOrder.isManualMeasurement && (
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Konvansiyonel</span>
                    </div>
                  )}
                  {selectedOrder.hasModel && (
                    <div className="flex items-center">
                      <Cube className="h-4 w-4 text-purple-500 mr-1" />
                      <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Model</span>
                    </div>
                  )}
                </div>
              </div>

              {user?.canViewPrices && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Fiyat</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ₺{(selectedOrder.finalPrice || selectedOrder.totalPrice).toLocaleString('tr-TR')}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Geliş Tarihi</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedOrder.arrivalDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Planlanan Teslim</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedOrder.deliveryDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>

              {selectedOrder.actualDeliveryDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gerçek Teslim Tarihi</label>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {new Date(selectedOrder.actualDeliveryDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              )}
              
              {selectedOrder.technicianId && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Teknisyen</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {getTechnicianById(selectedOrder.technicianId)?.name || 'Bilinmiyor'}
                  </p>
                </div>
              )}
              
              {selectedOrder.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notlar</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}