import React from 'react';
import OrderTimeline from './OrderTimeline.jsx';

const STATUS_STYLE = {
  CONFIRMED: 'text-gold border-[#483719] bg-[#261f13]',
  PROCESSING: 'text-gold border-[#483719] bg-[#261f13]',
  SHIPPED: 'text-sky-400 border-[#1e3a4a] bg-[#0f1f27]',
  DELIVERED: 'text-emerald border-[#184433] bg-[#10231b]',
  CANCELLED: 'text-rose border-[#421d21] bg-[#241315]',
};

const STATUS_LABEL = {
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Accepted / Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrdersModal({ open, onClose, orders, isAdmin, onCancelOrder, cancellingId }) {
  if (!open) return null;

  const CANCELLABLE = ['CONFIRMED', 'PROCESSING'];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-cardBg border border-[#242733] rounded-md w-full max-w-[640px] p-6 text-white max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline text-xl uppercase">{isAdmin ? 'All Orders' : 'My Orders'}</h3>
          <button onClick={onClose} className="text-slate-500 text-sm">✕</button>
        </div>

        {orders.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#0d0e12] border border-[#1c1e26] rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-xs font-mono text-slate-400">
                      Order #{order.id} · {new Date(order.created_at).toLocaleString()}
                    </div>
                    {isAdmin && <div className="text-[11px] text-slate-500">{order.buyer_email}</div>}
                    <div className="text-[11px] text-slate-500">{order.buyer_name} · {order.buyer_phone}</div>
                    <div className="text-[11px] text-slate-500">{order.buyer_address}</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_STYLE[order.status] || ''}`}>
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>

                <div className="border-t border-[#1c1e26] mt-2 pt-1">
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

                {!isAdmin && onCancelOrder && (
                  CANCELLABLE.includes(order.status) ? (
                    <div className="border-t border-[#1c1e26] mt-2 pt-2 flex justify-end">
                      <button
                        onClick={() => onCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded border bg-[#2a1417] text-rose border-[#4a1d22] hover:bg-[#4a1d22] disabled:opacity-50"
                      >
                        {cancellingId === order.id ? 'Cancelling…' : 'Cancel Order'}
                      </button>
                    </div>
                  ) : order.status === 'SHIPPED' || order.status === 'DELIVERED' ? (
                    <div className="border-t border-[#1c1e26] mt-2 pt-2 text-[10px] text-slate-600">
                      This order has shipped and can no longer be cancelled.
                    </div>
                  ) : null
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
