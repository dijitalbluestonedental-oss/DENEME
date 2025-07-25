import React from 'react';
import { useData } from '../contexts/DataContext';

const WorkSchedule = () => {
  const { orders, isLoading } = useData();

  if (isLoading) return <div>Yükleniyor...</div>;

  const todayStr = new Date().toISOString().split('T')[0];

  const safeSplitDate = (dateStr?: string) => {
    if (typeof dateStr !== 'string') return '';
    return dateStr.split('T')[0];
  };

  const dueTodayOrders = (orders ?? []).filter(order => {
    const deliveryDate = safeSplitDate(order.delivery_date);
    return deliveryDate === todayStr && order.status !== 'delivered';
  });

  const overdueOrders = (orders ?? []).filter(order => {
    const deliveryDate = safeSplitDate(order.delivery_date);
    return deliveryDate < todayStr && order.status !== 'delivered';
  });

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const endStr = nextWeek.toISOString().split('T')[0];

  const weeklyOrders = (orders ?? []).filter(order => {
    const deliveryDate = safeSplitDate(order.delivery_date);
    return deliveryDate >= todayStr && deliveryDate <= endStr;
  });

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">İş Takvimi</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Bugün Teslim Edilecekler</h2>
        {dueTodayOrders.length === 0 ? (
          <p>Bugün teslim edilecek iş yok.</p>
        ) : (
          <ul className="space-y-2">
            {dueTodayOrders.map(order => (
              <li key={order.id} className="bg-white shadow p-3 rounded">
                <strong>{order.patient_name}</strong> - {order.status}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Geciken Siparişler</h2>
        {overdueOrders.length === 0 ? (
          <p>Geciken sipariş yok.</p>
        ) : (
          <ul className="space-y-2">
            {overdueOrders.map(order => (
              <li key={order.id} className="bg-red-100 shadow p-3 rounded">
                <strong>{order.patient_name}</strong> - Teslim tarihi: {safeSplitDate(order.delivery_date)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Bu Hafta Teslim Edilecekler</h2>
        {weeklyOrders.length === 0 ? (
          <p>Bu hafta teslim edilecek iş yok.</p>
        ) : (
          <ul className="space-y-2">
            {weeklyOrders.map(order => (
              <li key={order.id} className="bg-blue-100 shadow p-3 rounded">
                <strong>{order.patient_name}</strong> - {safeSplitDate(order.delivery_date)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default WorkSchedule;
