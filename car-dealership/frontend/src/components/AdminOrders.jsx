import React, { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import OrderTimeline from './OrderTimeline.jsx';

const STATUS_STYLE = {
  CONFIRMED: 'text-gold border-[#483719] bg-[#261f13]',
  PROCESSING: 'text-gold border-[#483719] bg-[#261f13]',
  SHIPPED: 'text-sky-400 border-[#1e3a4a] bg-[#0f1f27]',
  DELIVERED: 'text-emerald border-[#184433] bg-[#10231b]',
  CANCELLED: 'text-rose border-[#421d21] bg-[#241315]',
};

// The next action(s) an admin can take from a given status. Mirrors
// ALLOWED_TRANSITIONS on the backend (Order.updateStatus enforces the
// real rule; this is just what we offer as buttons).
const ACTIONS = {
  CONFIRMED: [
    { to: 'PROCESSING', label: 'Accept Order', style: 'bg-gold text-black hover:bg-goldHover' },
    { to: 'CANCELLED', label: 'Cancel', style: 'bg-[#2a1417] text-rose border border-[#4a1d22] hover:bg-[#4a1d22]' },
  ],
  PROCESSING: [
    { to: 'SHIPPED', label: 'Mark Shipped', style: 'bg-gold text-black hover:bg-goldHover' },
    { to: 'CANCELLED', label: 'Cancel', style: 'bg-[#2a1417] text-rose border border-[#4a1d22] hover:bg-[#4a1d22]' },
  ],
  SHIPPED: [
    { to: 'DELIVERED', label: 'Mark Delivered', style: 'bg-emerald text-black hover:opacity-90' },
  ],
  DELIVERED: [],
  CANCELLED: [],
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await client.get('/orders');
      setOrders(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load orders.');
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await client.patch(`/orders/${orderId}/status`, { status });
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCsv = () => {
    const header = ['Order ID', 'Date', 'Customer Email', 'Buyer Name', 'Phone', 'Address', 'Status', 'Payment', 'Items', 'Total'];
    const rows = orders.map((o) => [
      o.id,
      new Date(o.created_at).toISOString(),
      o.buyer_email,
      o.buyer_name,
      o.buyer_phone,
      o.buyer_address,
      o.status,
      o.payment_method,
      o.items.map((i) => `${i.quantity}x ${i.make} ${i.model}`).join('; '),
      o.total_amount,
    ]);
    const escapeCell = (cell) => `"${String(cell).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apex-motors-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-5 flex justify-between items-start gap-3">
        <div>
          <h2 className="font-headline text-[26px] text-white">Order Management</h2>
          <p className="text-xs text-slate-400">Accept, ship, and deliver customer orders — or cancel and restock.</p>
        </div>
        {orders.length > 0 && (
          <button
            onClick={exportCsv}
            className="text-[11px] font-semibold px-3 py-1.5 rounded border border-borderCard text-slate-300 hover:border-gold hover:text-gold whitespace-nowrap"
          >
            ⬇ Export CSV
          </button>
        )}
      </div>

      {error && (
        <div className="text-rose text-sm mb-4 bg-[#241315] border border-[#421d21] rounded p-3">{error}</div>
      )}

      {orders.length === 0 ? (
        <div className="text-slate-500 text-sm py-10 text-center">No orders yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-cardBg border border-borderCard rounded p-4">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
                <div>
                  <div className="text-xs font-mono text-slate-400">
                    Order #{order.id} · {new Date(order.created_at).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">{order.buyer_email}</div>
                  <div className="text-[11px] text-slate-500">{order.buyer_name} · {order.buyer_phone}</div>
                  <div className="text-[11px] text-slate-500">{order.buyer_address}</div>
                  {order.notes && <div className="text-[11px] text-slate-600 italic">"{order.notes}"</div>}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_STYLE[order.status] || ''}`}>
                    {order.status}
                  </span>
                  <div className="flex gap-1.5">
                    {(ACTIONS[order.status] || []).map((action) => (
                      <button
                        key={action.to}
                        disabled={updatingId === order.id}
                        onClick={() => updateStatus(order.id, action.to)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold disabled:opacity-50 ${action.style}`}
                      >
                        {updatingId === order.id ? 'Updating…' : action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1c1e26] mt-1 pt-1">
                <OrderTimeline status={order.status} />
              </div>

              <div className="border-t border-[#1c1e26] mt-2 pt-2 text-xs">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-0.5">
                    <span className="text-slate-300">{item.quantity} × {item.make} {item.model}</span>
                    <span className="text-slate-400">${(item.unit_price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1.5 mt-1.5 border-t border-[#1c1e26] font-semibold">
                  <span>Total</span>
                  <span className="text-gold">${Number(order.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
