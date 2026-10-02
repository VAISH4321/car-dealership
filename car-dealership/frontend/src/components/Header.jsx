import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Header({ onOpenAuth, onOpenCart, onOpenOrders, onOpenFavorites }) {
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-bgDark border-b border-borderDark px-4 sm:px-6 py-4 sticky top-0 z-50">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="font-headline text-2xl font-bold text-white">
            APEX<span className="text-gold">MOTORS</span>
          </div>
          {user && (
            <div className="hidden sm:block text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase pl-2.5 border-l border-[#22252e]">
              {isAdmin ? 'Admin Portal' : 'Customer Portal'}
            </div>
          )}
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {!isAdmin && (
                <>
                  <button
                    onClick={onOpenFavorites}
                    className="text-[11px] text-slate-400 border border-borderCard rounded px-2.5 py-1 hover:text-rose hover:border-rose"
                  >
                    ♥ Favorites
                  </button>
                  <button
                    onClick={onOpenOrders}
                    className="text-[11px] text-slate-400 border border-borderCard rounded px-2.5 py-1 hover:text-gold hover:border-gold"
                  >
                    My Orders
                  </button>
                  <button
                    onClick={onOpenCart}
                    className="relative text-[11px] text-slate-400 border border-borderCard rounded px-2.5 py-1 hover:text-gold hover:border-gold"
                  >
                    Cart
                    {count > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gold text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </button>
                </>
              )}
              <span className="text-[11px] text-slate-400">
                {user.email} {isAdmin && <span className="text-gold">(Admin)</span>}
              </span>
              <button
                onClick={logout}
                className="bg-gold hover:bg-goldHover text-black text-[11px] font-semibold px-2.5 py-1 rounded"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="text-slate-300 hover:text-gold text-xs font-semibold tracking-wide px-3.5 py-2"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="bg-gold hover:bg-goldHover text-black text-xs font-semibold tracking-wide px-4.5 py-2 rounded"
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden relative text-slate-300 w-9 h-9 flex items-center justify-center border border-borderCard rounded"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {!isAdmin && count > 0 && !menuOpen && (
            <span className="absolute -top-1.5 -right-1.5 bg-gold text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {count}
            </span>
          )}
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden mt-3 flex flex-col gap-2 pb-1">
          {user ? (
            <>
              <div className="text-[11px] text-slate-500 uppercase tracking-wide">
                {user.email} {isAdmin && <span className="text-gold">(Admin)</span>}
              </div>
              {!isAdmin && (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); onOpenFavorites(); }}
                    className="text-left text-xs text-slate-300 border border-borderCard rounded px-3 py-2"
                  >
                    ♥ Favorites
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onOpenOrders(); }}
                    className="text-left text-xs text-slate-300 border border-borderCard rounded px-3 py-2"
                  >
                    My Orders
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onOpenCart(); }}
                    className="text-left text-xs text-slate-300 border border-borderCard rounded px-3 py-2"
                  >
                    Cart {count > 0 && `(${count})`}
                  </button>
                </>
              )}
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="bg-gold hover:bg-goldHover text-black text-xs font-semibold px-3 py-2 rounded"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setMenuOpen(false); onOpenAuth('login'); }}
                className="text-left text-slate-300 text-xs font-semibold px-3 py-2 border border-borderCard rounded"
              >
                Sign In
              </button>
              <button
                onClick={() => { setMenuOpen(false); onOpenAuth('register'); }}
                className="bg-gold hover:bg-goldHover text-black text-xs font-semibold px-3 py-2 rounded"
              >
                Register
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
