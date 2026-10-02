import React from 'react';

export default function OrderConfirmationModal({ order, onClose, onViewOrders }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-cardBg border border-[#242733] rounded-md w-full max-w-[440px] p-6 text-white text-center">
        <div className="w-12 h-12 rounded-full bg-[#10231b] border border-[#184433] text-emerald flex items-center justify-center mx-auto mb-4 text-2xl">
          ✓
        </div>
        <h3 className="font-headline text-2xl uppercase mb-1">Booking Confirmed</h3>
        <p className="text-xs text-slate-400 mb-4">
          Order <span className="text-gold font-mono">#{order.id}</span> is locked in. A member of our team will reach out to {order.buyer_phone} to arrange delivery.
        </p>

        <div className="bg-[#0d0e12] border border-[#1c1e26] rounded p-3 mb-4 text-xs text-left">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-1">
              <span className="text-slate-300">{item.quantity} × {item.make} {item.model}</span>
              <span className="text-slate-400">${(item.unit_price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-2 border-t border-[#1c1e26] font-semibold">
            <span>Total</span>
            <span className="text-gold">${Number(order.total_amount).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={onViewOrders} className="w-full py-2.5 bg-gold hover:bg-goldHover text-black text-xs font-bold uppercase rounded">
            View My Orders
          </button>
          <button onClick={onClose} className="w-full py-2.5 text-slate-400 text-xs">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
