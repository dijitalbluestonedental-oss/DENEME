import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { 
  Package, 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Target,
  PlayCircle,
  PauseCircle,
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#6B7280'];

export default function Dashboard() {
  const { user } = useAuth();
  const { orders, technicians, getDoctorById, getProsthesisTypeById } = useData();

  const today = new Date().toISOString().split('T')[0];
  
  const todayOrders = orders.filter(order => 
    order.arrivalDate.split('T')[0] === today
  );
  
  const todayDelivered = orders.filter(order => 
    order.actualDeliveryDate && order.actualDeliveryDate.split('T')[0] === today
  );

  const stats = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
    waitingOrders: orders.filter(o => o.status === 'waiting').length,
    inProgressOrders: orders.filter(o => o.status === 'in-progress').length,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    activeTechnicians: technicians.filter(t => t.isActive).length,
    todayIncoming: todayOrders.length,
    todayDelivered: todayDelivered.length
  };

  const statusData = [
    { name: 'Bekleyen', value: orders.filter(o => o.status === 'waiting').length, color: '#F59E0B' },
    { name: 'Devam Eden', value: orders.filter(o => o.status === 'in-progress').length, color: '#3B82F6' },
    { name: 'Tamamlanan', value: orders.filter(o => o.status === 'completed').length, color: '#10B981' },
    { name: 'Teslim Edilen', value: orders.filter(o => o.status === 'delivered').length, color: '#6B7280' },
  ];

  const waitingOrders = orders.filter(o => o.status === 'waiting').slice(0, 5);
  const deliveredOrders = orders.filter(o => o.status === 'delivered').slice(0, 5);

  const exportDailyReport = () => {
    const reportData = [
      ...todayOrders.map(order => ({
        'Tip': 'Gelen Sipariş',
        'Hasta Adı': order.patientName,
        'Hekim': getDoctorById(order.doctorId)?.name || 'Bilinmiyor',
        'Protez Türü': getProsthesisTypeById(order.prosthesisTypeId)?.name || 'Bilinmiyor',
        'Adet': order.unitCount,
        'Durum': order.status === 'waiting' ? 'Bekliyor' :
                 order.status === 'in-progress' ? 'Devam Ediyor' :
                 order.status === 'completed' ? 'Tamamlandı' : 'Teslim Edildi',
        'Tarih': new Date(order.arrivalDate).toLocaleDateString('tr-TR'),
        'Teslim Tarihi': new Date(order.deliveryDate).toLocaleDateString('tr-TR')
      })),
      ...todayDelivered.map(order => ({
        'Tip': 'Teslim Edilen',
        'Hasta Adı': order.patientName,
        'Hekim': getDoctorById(order.doctorId)?.name || 'Bilinmiyor',
        'Protez Türü': getProsthesisTypeById(order.prosthesisTypeId)?.name || 'Bilinmiyor',
        'Adet': order.unitCount,
        'Durum': 'Teslim Edildi',
        'Tarih': new Date(order.actualDeliveryDate).toLocaleDateString('tr-TR'),
        'Teslim Tarihi': new Date(order.deliveryDate).toLocaleDateString('tr-TR')
      }))
    ];

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Günlük Rapor');
    XLSX.writeFile(wb, `Gunluk_Rapor_${today}.xlsx`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Kontrol Paneli
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Hoş geldiniz, {user?.name}! İşte bugünkü genel durum.
          </p>
        </div>
        
        <button
          onClick={exportDailyReport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-5 w-5 mr-2" />
          Günlük Rapor
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Sipariş</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Teslim Edildi</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.deliveredOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bekleyen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.waitingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <PlayCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Devam Eden</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgressOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bugün Gelen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayIncoming}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bugün Çıkan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayDelivered}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order Status Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Sipariş Durumu Dağılımı
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Bugünkü Aktivite
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Gelen Siparişler</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bugün laboratuvara gelen</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.todayIncoming}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg mr-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Teslim Edilenler</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bugün teslim edilen</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.todayDelivered}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Aktif Teknisyen</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Çalışan teknisyen sayısı</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {stats.activeTechnicians}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Waiting Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <PauseCircle className="h-5 w-5 mr-2 text-yellow-600" />
            Bekleyen Siparişler ({stats.waitingOrders})
          </h3>
          <div className="space-y-3">
            {waitingOrders.length > 0 ? (
              waitingOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.patientName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getDoctorById(order.doctorId)?.name} - {getProsthesisTypeById(order.prosthesisTypeId)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Teslim Tarihi</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(order.deliveryDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <PauseCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Bekleyen sipariş bulunmuyor</p>
              </div>
            )}
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Teslim Edilenler ({stats.deliveredOrders})
          </h3>
          <div className="space-y-3">
            {deliveredOrders.length > 0 ? (
              deliveredOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.patientName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getDoctorById(order.doctorId)?.name} - {getProsthesisTypeById(order.prosthesisTypeId)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Teslim Tarihi</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {order.actualDeliveryDate 
                        ? new Date(order.actualDeliveryDate).toLocaleDateString('tr-TR')
                        : new Date(order.deliveryDate).toLocaleDateString('tr-TR')
                      }
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Teslim edilen sipariş bulunmuyor</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}