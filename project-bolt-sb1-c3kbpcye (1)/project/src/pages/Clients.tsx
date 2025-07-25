import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Download,
  Search,
  Filter,
  Eye,
  Plus,
  Edit,
  ChevronDown,
  ChevronRight,
  Package,
  Calendar,
  Users,
  Percent,
  DollarSign,
  Save
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Clients() {
  const { user } = useAuth();
  const { 
    clinics, 
    doctors, 
    orders, 
    payments,
    updateOrder,
    getDoctorsByClinic,
    getOrdersByDoctor,
    getPaymentsByDoctor,
    getProsthesisTypeById
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [expandedClinics, setExpandedClinics] = useState<string[]>([]);
  const [expandedDoctors, setExpandedDoctors] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const filteredClinics = clinics.filter(clinic => 
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClinic = selectedClinic === 'all' || doctor.clinicId === selectedClinic;
    return matchesSearch && matchesClinic;
  });

  const toggleClinicExpansion = (clinicId: string) => {
    setExpandedClinics(prev => 
      prev.includes(clinicId) 
        ? prev.filter(id => id !== clinicId)
        : [...prev, clinicId]
    );
  };

  const toggleDoctorExpansion = (doctorId: string) => {
    setExpandedDoctors(prev => 
      prev.includes(doctorId) 
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  const calculateDoctorStats = (doctorId: string) => {
    const doctorOrders = getOrdersByDoctor(doctorId);
    const deliveredOrders = doctorOrders.filter(order => order.status === 'delivered');
    const totalDebt = deliveredOrders.reduce((sum, order) => sum + (order.finalPrice || order.totalPrice), 0);
    
    const doctorPayments = getPaymentsByDoctor(doctorId);
    const totalPayments = doctorPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const currentBalance = totalDebt - totalPayments;
    
    return {
      totalOrders: doctorOrders.length,
      deliveredOrders: deliveredOrders.length,
      totalDebt,
      totalPayments,
      currentBalance
    };
  };

  const handleDiscountSave = (orderId: string) => {
    updateOrder(orderId, { discountAmount });
    setEditingOrderId(null);
    setDiscountAmount(0);
  };

  const exportClientsData = () => {
    const clinicsData = clinics.map(clinic => {
      const clinicDoctors = getDoctorsByClinic(clinic.id);
      const totalDebt = clinicDoctors.reduce((sum, doctor) => {
        const stats = calculateDoctorStats(doctor.id);
        return sum + stats.currentBalance;
      }, 0);

      return {
        'Klinik Adı': clinic.name,
        'Adres': clinic.address || '',
        'Telefon': clinic.phone || '',
        'E-posta': clinic.email || '',
        'Hekim Sayısı': clinicDoctors.length,
        'Toplam Borç': totalDebt
      };
    });

    const doctorsData = doctors.map(doctor => {
      const clinic = clinics.find(c => c.id === doctor.clinicId);
      const stats = calculateDoctorStats(doctor.id);
      
      return {
        'Hekim Adı': doctor.name,
        'Klinik': clinic?.name || '',
        'Telefon': doctor.phone || '',
        'E-posta': doctor.email || '',
        'Toplam Sipariş': stats.totalOrders,
        'Teslim Edilen': stats.deliveredOrders,
        'Toplam Borç': stats.totalDebt,
        'Ödenen': stats.totalPayments,
        'Kalan Borç': stats.currentBalance
      };
    });

    const wb = XLSX.utils.book_new();
    
    const clinicsWs = XLSX.utils.json_to_sheet(clinicsData);
    XLSX.utils.book_append_sheet(wb, clinicsWs, 'Klinikler');
    
    const doctorsWs = XLSX.utils.json_to_sheet(doctorsData);
    XLSX.utils.book_append_sheet(wb, doctorsWs, 'Hekimler');
    
    XLSX.writeFile(wb, `Cariler_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportDoctorOrders = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    const clinic = clinics.find(c => c.id === doctor?.clinicId);
    const doctorOrders = getOrdersByDoctor(doctorId).filter(order => order.status === 'delivered');
    
    const exportData = doctorOrders.map(order => ({
      'Barkod': order.barcode,
      'Hasta Adı': order.patientName,
      'Protez Türü': getProsthesisTypeById(order.prosthesisTypeId)?.name || 'Bilinmiyor',
      'Adet': order.unitCount,
      'Birim Fiyat': user?.canViewPrices ? getProsthesisTypeById(order.prosthesisTypeId)?.basePrice : '***',
      'Toplam Fiyat': user?.canViewPrices ? order.totalPrice : '***',
      'İndirim': user?.canViewPrices ? (order.discountAmount || 0) : '***',
      'Final Fiyat': user?.canViewPrices ? (order.finalPrice || order.totalPrice) : '***',
      'Model': order.hasModel ? 'Evet' : 'Hayır',
      'Geliş Tarihi': new Date(order.arrivalDate).toLocaleDateString('tr-TR'),
      'Teslim Tarihi': new Date(order.deliveryDate).toLocaleDateString('tr-TR'),
      'Tamamlanma Tarihi': order.completionDate ? new Date(order.completionDate).toLocaleDateString('tr-TR') : '',
      'Notlar': order.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teslim Edilen Siparişler');
    
    XLSX.writeFile(wb, `${doctor?.name}_Teslim_Edilen_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalStats = {
    totalClinics: clinics.length,
    totalDoctors: doctors.length,
    totalDebt: doctors.reduce((sum, doctor) => {
      const stats = calculateDoctorStats(doctor.id);
      return sum + stats.currentBalance;
    }, 0),
    totalOrders: orders.filter(o => o.status === 'delivered').length
  };

  if (user?.role === 'technician') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Erişim Reddedildi
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Cari hesaplar sayfasına teknisyenler erişemez.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cari Hesaplar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Klinik ve hekim hesaplarını detaylı takip edin
          </p>
        </div>
        
        <button
          onClick={exportClientsData}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-5 w-5 mr-2" />
          Excel'e Aktar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Klinik</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.totalClinics}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <User className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Hekim</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.totalDoctors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Alacak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.canViewPrices ? `₺${totalStats.totalDebt.toLocaleString('tr-TR')}` : '***'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Teslim Edilen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.totalOrders}</p>
            </div>
          </div>
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
                placeholder="Klinik veya hekim adı ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tüm Klinikler</option>
              {clinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Clinics and Doctors */}
      <div className="space-y-6">
        {filteredClinics.map(clinic => {
          const clinicDoctors = getDoctorsByClinic(clinic.id);
          const isExpanded = expandedClinics.includes(clinic.id);
          const clinicTotalDebt = clinicDoctors.reduce((sum, doctor) => {
            const stats = calculateDoctorStats(doctor.id);
            return sum + stats.currentBalance;
          }, 0);

          return (
            <div key={clinic.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Clinic Header */}
              <div 
                className="p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => toggleClinicExpansion(clinic.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {clinic.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        {clinic.phone && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="h-4 w-4 mr-1" />
                            {clinic.phone}
                          </div>
                        )}
                        {clinic.email && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Mail className="h-4 w-4 mr-1" />
                            {clinic.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Hekim Sayısı</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {clinicDoctors.length}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Borç</p>
                      <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                        {user?.canViewPrices ? `₺${clinicTotalDebt.toLocaleString('tr-TR')}` : '***'}
                      </p>
                    </div>
                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctors List */}
              {isExpanded && (
                <div className="p-6">
                  <div className="space-y-4">
                    {clinicDoctors.map(doctor => {
                      const stats = calculateDoctorStats(doctor.id);
                      const isDoctorExpanded = expandedDoctors.includes(doctor.id);
                      const doctorOrders = getOrdersByDoctor(doctor.id).filter(order => order.status === 'delivered');
                      
                      return (
                        <div key={doctor.id} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                          {/* Doctor Header */}
                          <div 
                            className="p-4 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            onClick={() => toggleDoctorExpansion(doctor.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {doctor.name}
                                  </h4>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                    {doctor.phone && (
                                      <span className="flex items-center">
                                        <Phone className="h-3 w-3 mr-1" />
                                        {doctor.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Teslim Edilen</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{stats.deliveredOrders}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Kalan Borç</p>
                                  <p className={`text-sm font-semibold ${
                                    stats.currentBalance > 0 
                                      ? 'text-red-600 dark:text-red-400' 
                                      : 'text-green-600 dark:text-green-400'
                                  }`}>
                                    {user?.canViewPrices ? `₺${stats.currentBalance.toLocaleString('tr-TR')}` : '***'}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportDoctorOrders(doctor.id);
                                  }}
                                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1"
                                  title="Excel'e Aktar"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <div className="ml-2">
                                  {isDoctorExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Doctor Orders Detail */}
                          {isDoctorExpanded && (
                            <div className="p-4">
                              <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                                <Package className="h-4 w-4 mr-2" />
                                Teslim Edilen Siparişler ({doctorOrders.length} adet)
                              </h5>
                              
                              {doctorOrders.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                    <thead className="bg-gray-50 dark:bg-gray-600">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                          Barkod
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                          Hasta Adı
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                          Protez Türü
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                          Adet
                                        </th>
                                        {user?.canViewPrices && (
                                          <>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                              Toplam
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                              İndirim
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                              Final
                                            </th>
                                          </>
                                        )}
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                          Teslim Tarihi
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                          İşlemler
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                      {doctorOrders.map(order => (
                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                          <td className="px-3 py-2 text-xs font-mono text-gray-900 dark:text-white">
                                            {order.barcode}
                                          </td>
                                          <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                                            {order.patientName}
                                          </td>
                                          <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                                            {getProsthesisTypeById(order.prosthesisTypeId)?.name}
                                          </td>
                                          <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                                            <div className="flex items-center">
                                              <Users className="h-3 w-3 mr-1 text-gray-400" />
                                              {order.unitCount}
                                            </div>
                                          </td>
                                          {user?.canViewPrices && (
                                            <>
                                              <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white">
                                                ₺{order.totalPrice.toLocaleString('tr-TR')}
                                              </td>
                                              <td className="px-3 py-2 text-xs">
                                                {editingOrderId === order.id ? (
                                                  <div className="flex items-center space-x-1">
                                                    <input
                                                      type="number"
                                                      value={discountAmount}
                                                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                                      className="w-16 px-1 py-1 text-xs border rounded"
                                                      min="0"
                                                      max={order.totalPrice}
                                                    />
                                                    <button
                                                      onClick={() => handleDiscountSave(order.id)}
                                                      className="text-green-600 hover:text-green-800"
                                                    >
                                                      <Save className="h-3 w-3" />
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center space-x-1">
                                                    <span className="text-red-600 dark:text-red-400">
                                                      ₺{(order.discountAmount || 0).toLocaleString('tr-TR')}
                                                    </span>
                                                    <button
                                                      onClick={() => {
                                                        setEditingOrderId(order.id);
                                                        setDiscountAmount(order.discountAmount || 0);
                                                      }}
                                                      className="text-blue-600 hover:text-blue-800"
                                                    >
                                                      <Edit className="h-3 w-3" />
                                                    </button>
                                                  </div>
                                                )}
                                              </td>
                                              <td className="px-3 py-2 text-xs font-bold text-green-600 dark:text-green-400">
                                                ₺{(order.finalPrice || order.totalPrice).toLocaleString('tr-TR')}
                                              </td>
                                            </>
                                          )}
                                          <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                                            <div className="flex items-center">
                                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                              {new Date(order.actualDeliveryDate || order.deliveryDate).toLocaleDateString('tr-TR')}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 text-xs">
                                            <div className="flex items-center space-x-1">
                                              {order.hasModel && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                                  Model
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">Henüz teslim edilen sipariş bulunmuyor</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}