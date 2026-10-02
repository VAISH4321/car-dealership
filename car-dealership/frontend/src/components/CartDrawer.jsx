import React from 'react';
import { useCart } from '../context/CartContext.jsx';

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { items, updateQuantity, removeItem, total } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-[380px] bg-cardBg border-l border-borderCard h-full flex flex-col text-white">
        <div className="flex justify-between items-center px-5 py-4 border-b border-[#1c1e26]">
          <h3 className="font-headline text-lg uppercase">Your Cart</h3>
          <button onClick={onClose} className="text-slate-500 text-sm">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-slate-500 text-sm text-center mt-10">Your cart is empty.</p>
          ) : (
            items.map(({ vehicle, quantity }) => (
              <div key={vehicle.id} className="bg-[#0d0e12] border border-[#1c1e26] rounded p-3">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-12 h-9 rounded overflow-hidden bg-[#07080a] border border-[#1c1e26] flex-shrink-0">
                      {vehicle.image_url ? (
                        <img src={vehicle.image_url} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-headline uppercase text-white truncate">{vehicle.make} {vehicle.model}</div>
                      <div className="text-[11px] text-slate-500">${Number(vehicle.price).toLocaleString()} each</div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(vehicle.id)} className="text-rose text-[11px] flex-shrink-0">Remove</button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(vehicle.id, Math.max(1, quantity - 1))}
                    className="w-6 h-6 bg-[#17181f] border border-[#282a36] text-slate-200 rounded"
                  >
                    −
                  </button>
                  <span className="text-xs w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(vehicle.id, Math.min(vehicle.quantity, quantity + 1))}
                    disabled={quantity >= vehicle.quantity}
                    className="w-6 h-6 bg-[#17181f] border border-[#282a36] text-slate-200 rounded disabled:opacity-40"
                  >
                    +
                  </button>
                  <span className="ml-auto text-xs text-gold font-semibold">
                    ${(vehicle.price * quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-[#1c1e26]">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-slate-400">Total</span>
              <span className="font-bold text-gold">${total.toLocaleString()}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-2.5 bg-gold hover:bg-goldHover text-black text-xs font-bold uppercase rounded"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
