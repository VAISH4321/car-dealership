import React, { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import AnimatedNumber from './AnimatedNumber.jsx';

const STATUS_ORDER = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const STATUS_COLOR = {
  CONFIRMED: 'bg-gold',
  PROCESSING: 'bg-gold',
  SHIPPED: 'bg-sky-400',
  DELIVERED: 'bg-emerald',
  CANCELLED: 'bg-rose',
};

export default function AdminDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [vRes, oRes] = await Promise.all([client.get('/vehicles'), client.get('/orders')]);
    setVehicles(vRes.data);
    setOrders(oRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return <div className="text-slate-500 text-sm py-10 text-center">Loading dashboard…</div>;
  }

  const activeOrders = orders.filter((o) => o.status !== 'CANCELLED');
  const revenue = activeOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const unitsSold = activeOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  const avgOrderValue = activeOrders.length ? revenue / activeOrders.length : 0;

  const statusCounts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  const lowStock = vehicles.filter((v) => v.quantity > 0 && v.quantity <= 3).sort((a, b) => a.quantity - b.quantity);
  const outOfStock = vehicles.filter((v) => v.quantity === 0);

  const salesByModel = {};
  activeOrders.forEach((o) => {
    o.items.forEach((item) => {
      const key = `${item.make} ${item.model}`;
      salesByModel[key] = (salesByModel[key] || 0) + item.quantity;
    });
  });
  const topSellers = Object.entries(salesByModel).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSold = topSellers.length ? topSellers[0][1] : 1;

  const totalInventoryValue = vehicles.reduce((sum, v) => sum + Number(v.price) * v.quantity, 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline text-[26px] text-white">Dashboard</h2>
        <p className="text-xs text-slate-400">A live snapshot of sales, stock health, and demand.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Revenue" value={revenue} prefix="$" accent="text-gold" />
        <StatCard label="Units Sold" value={unitsSold} accent="text-emerald" />
        <StatCard label="Avg Order Value" value={Math.round(avgOrderValue)} prefix="$" accent="text-sky-400" />
        <StatCard label="Inventory Value" value={Math.round(totalInventoryValue)} prefix="$" accent="text-slate-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order funnel */}
        <div className="bg-cardBg border border-borderCard rounded p-4 lg:col-span-1">
          <h3 className="font-headline text-sm uppercase text-white mb-3 tracking-wide">Order Funnel</h3>
          <div className="flex flex-col gap-2.5">
            {STATUS_ORDER.map((s) => {
              const count = statusCounts[s];
              const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex justify-between text-[10px] uppercase text-slate-400 mb-1 font-mono">
                    <span>{s}</span>
                    <span className="text-slate-200 font-semibold"><AnimatedNumber value={count} /></span>
                  </div>
                  <div className="h-1.5 bg-[#0d0e12] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${STATUS_COLOR[s]} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-cardBg border border-borderCard rounded p-4 lg:col-span-1">
          <h3 className="font-headline text-sm uppercase text-white mb-3 tracking-wide">
            Stock Alerts
            {(lowStock.length + outOfStock.length) > 0 && (
              <span className="ml-2 text-[10px] text-rose font-mono">{lowStock.length + outOfStock.length} need attention</span>
            )}
          </h3>
          {lowStock.length === 0 && outOfStock.length === 0 ? (
            <p className="text-xs text-slate-500">Everything is healthily stocked.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
              {outOfStock.map((v) => (
                <div key={v.id} className="flex justify-between items-center text-xs bg-[#241315] border border-[#421d21] rounded px-2.5 py-1.5">
                  <span className="text-slate-200">{v.make} {v.model}</span>
                  <span className="text-rose font-mono font-bold">SOLD OUT</span>
                </div>
              ))}
              {lowStock.map((v) => (
                <div key={v.id} className="flex justify-between items-center text-xs bg-[#261f13] border border-[#483719] rounded px-2.5 py-1.5">
                  <span className="text-slate-200">{v.make} {v.model}</span>
                  <span className="text-gold font-mono font-bold">{v.quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top sellers */}
        <div className="bg-cardBg border border-borderCard rounded p-4 lg:col-span-1">
          <h3 className="font-headline text-sm uppercase text-white mb-3 tracking-wide">Top Sellers</h3>
          {topSellers.length === 0 ? (
            <p className="text-xs text-slate-500">No sales recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topSellers.map(([model, qty]) => (
                <div key={model}>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>{model}</span>
                    <span className="font-mono text-gold">{qty} sold</span>
                  </div>
                  <div className="h-1.5 bg-[#0d0e12] rounded-full overflow-hidden">
                    <div className="h-full bg-gold transition-all duration-500" style={{ width: `${(qty / maxSold) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, prefix = '', accent }) {
  return (
    <div className="bg-cardBg border border-borderCard rounded p-4">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1.5">{label}</div>
      <div className={`text-xl md:text-2xl font-bold font-mono ${accent}`}>
        <AnimatedNumber value={value} prefix={prefix} />
      </div>
    </div>
  );
}
