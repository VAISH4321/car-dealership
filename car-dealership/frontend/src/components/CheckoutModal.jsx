import React, { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';

const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Credit / Debit Card' },
  { value: 'FINANCING', label: 'Dealership Financing' },
  { value: 'CASH', label: 'Cash on Pickup' },
];

export default function CheckoutModal({ open, onClose, onConfirm, error, submitting }) {
  const { items, total } = useCart();
  const [form, setForm] = useState({ name: '', phone: '', address: '', paymentMethod: 'CARD', notes: '' });

  if (!open) return null;

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(form);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-cardBg border border-[#242733] rounded-md w-full max-w-[460px] p-6 text-white max-h-[90vh] overflow-y-auto">
        <h3 className="font-headline text-xl uppercase mb-1">Confirm Your Booking</h3>
        <p className="text-xs text-slate-400 mb-4">Tell us where to reach you and we'll lock in your order.</p>

        <div className="bg-[#0d0e12] border border-[#1c1e26] rounded p-3 mb-4 text-xs">
          {items.map(({ vehicle, quantity }) => (
            <div key={vehicle.id} className="flex justify-between py-1">
              <span className="text-slate-300">{quantity} × {vehicle.make} {vehicle.model}</span>
              <span className="text-slate-400">${(vehicle.price * quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-2 border-t border-[#1c1e26] font-semibold">
            <span>Total</span>
            <span className="text-gold">${total.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block font-medium">Full name</label>
            <input required value={form.name} onChange={(e) => update('name', e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block font-medium">Phone number</label>
            <input required value={form.phone} onChange={(e) => update('phone', e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold" placeholder="+1 555-123-4567" />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block font-medium">Delivery / pickup address</label>
            <input required value={form.address} onChange={(e) => update('address', e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold" placeholder="123 Main St, Springfield" />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block font-medium">Payment method</label>
            <select value={form.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold">
              {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block font-medium">Notes (optional)</label>
            <input value={form.notes} onChange={(e) => update('notes', e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold" placeholder="Preferred pickup time, trade-in, etc." />
          </div>

          {error && <div className="text-rose text-xs bg-[#241315] border border-[#421d21] rounded p-2">{error}</div>}

          <button type="submit" disabled={submitting}
            className="w-full py-2.5 bg-gold hover:bg-goldHover text-black text-xs font-bold uppercase rounded mt-1 disabled:opacity-60">
            {submitting ? 'Placing order…' : 'Confirm Booking'}
          </button>
        </form>

        <button type="button" onClick={onClose} className="mt-2 text-slate-500 text-xs w-full text-center">
          Back to cart
        </button>
      </div>
    </div>
  );
}
