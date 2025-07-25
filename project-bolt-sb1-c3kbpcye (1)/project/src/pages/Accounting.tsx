import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  Download,
  Calendar,
  PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

export default function Accounting() {
  const { user } = useAuth();
  const { orders, technicians, prosthesisTypes, getTechnicianById, getProsthesisTypeById } = useData();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Calculate financial data
  const calculateFinancials = () => {
    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.arrivalDate);
      return orderDate.getMonth() === selectedMonth && 
             orderDate.getFullYear() === selectedYear;
    });

    const totalRevenue = monthlyOrders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => {
        const prosthesis = getProsthesisTypeById(order.prosthesisTypeId);
        return sum + (prosthesis?.basePrice || 0);
      }, 0);

    const totalSalaries = technicians
      .filter(tech => tech.isActive)
      .reduce((sum, tech) => sum + tech.salary, 0);

    const materialCosts = monthlyOrders
      .reduce((sum, order) => sum + (order.cost || 0), 0);

    const netProfit = totalRevenue - totalSalaries - materialCosts;

    return {
      totalRevenue,
      totalSalaries,
      materialCosts,
      netProfit,
      monthlyOrders: monthlyOrders.length,
      completedOrders: monthlyOrders.filter(o => o.status === 'delivered').length
    };
  };

  const financials = calculateFinancials();

  // Technician earnings data
  const technicianEarnings = technicians.map(tech => {
    const techOrders = orders.filter(order => 
      order.technicianId === tech.id && 
      order.status === 'delivered' &&
      new Date(order.completionDate || '').getMonth() === selectedMonth &&
      new Date(order.completionDate || '').getFullYear() === selectedYear
    );

    const earnings = techOrders.reduce((sum, order) => {
      const prosthesis = getProsthesisTypeById(order.prosthesisTypeId);
      return sum + (prosthesis?.basePrice || 0) * 0.1; // 10% commission
    }, 0);

    return {
      name: tech.name,
      baseSalary: tech.salary,
      commission: earnings,
      total: tech.salary + earnings,
      orderCount: techOrders.length
    };
  });

  const exportFinancialReport = () => {
    const reportData = [
      { 'Kategori': 'Toplam Gelir', 'Tutar': financials.totalRevenue },
      { 'Kategori': 'Teknisyen Maaşları', 'Tutar': financials.totalSalaries },
      { 'Kategori': 'Malzeme Giderleri', 'Tutar': financials.materialCosts },
      { 'Kategori': 'Net Kar', 'Tutar': financials.netProfit },
    ];

    const technicianData = technicianEarnings.map(tech => ({
      'Teknisyen': tech.name,
      'Temel Maaş': tech.baseSalary,
      'Komisyon': tech.commission,
      'Toplam': tech.total,
      'Sipariş Sayısı': tech.orderCount
    }));

    const wb = XLSX.utils.book_new();
    
    const finWs = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, finWs, 'Mali Özet');
    
    const techWs = XLSX.utils.json_to_sheet(technicianData);
    XLSX.utils.book_append_sheet(wb, techWs, 'Teknisyen Kazançları');
    
    XLSX.writeFile(wb, `Mali_Rapor_${selectedYear}_${selectedMonth + 1}.xlsx`);
  };

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Muhasebe</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Mali durumu görüntüleyin ve raporlar oluşturun
          </p>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
          
          <button
            onClick={exportFinancialReport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gelir</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₺{financials.totalRevenue.toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gider</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₺{(financials.totalSalaries + financials.materialCosts).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              financials.netProfit >= 0 
                ? 'bg-blue-100 dark:bg-blue-900/20' 
                : 'bg-red-100 dark:bg-red-900/20'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                financials.netProfit >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Kar</p>
              <p className={`text-2xl font-bold ${
                financials.netProfit >= 0 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                ₺{financials.netProfit.toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Calculator className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tamamlanan Sipariş</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {financials.completedOrders}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Technician Earnings Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Teknisyen Kazançları
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={technicianEarnings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `₺${value.toLocaleString('tr-TR')}`} />
                <Bar dataKey="baseSalary" fill="#3B82F6" name="Temel Maaş" />
                <Bar dataKey="commission" fill="#10B981" name="Komisyon" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Gider Dağılımı ({monthNames[selectedMonth]} {selectedYear})
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Teknisyen Maaşları</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {technicians.filter(t => t.isActive).length} aktif teknisyen
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  ₺{financials.totalSalaries.toLocaleString('tr-TR')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {((financials.totalSalaries / (financials.totalSalaries + financials.materialCosts)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Malzeme Giderleri</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {financials.monthlyOrders} sipariş için
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  ₺{financials.materialCosts.toLocaleString('tr-TR')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {((financials.materialCosts / (financials.totalSalaries + financials.materialCosts)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technician Details Table */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Teknisyen Detay Raporu - {monthNames[selectedMonth]} {selectedYear}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Teknisyen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Temel Maaş
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Komisyon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Toplam Kazanç
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tamamlanan İş
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {technicianEarnings.map((tech, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {tech.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₺{tech.baseSalary.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                    ₺{tech.commission.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    ₺{tech.total.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {tech.orderCount} adet
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}