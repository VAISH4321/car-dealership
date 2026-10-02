import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { useCompare } from './context/CompareContext.jsx';
import Header from './components/Header.jsx';
import Landing from './components/Landing.jsx';
import CustomerPortal from './components/CustomerPortal.jsx';
import AdminPortal from './components/AdminPortal.jsx';
import AuthModal from './components/AuthModal.jsx';

export default function App() {
  const { user, isAdmin, loading } = useAuth();
  const { vehicles: compareVehicles } = useCompare();

  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [cartOpenRequest, setCartOpenRequest] = useState(0);
  const [favoritesOpenRequest, setFavoritesOpenRequest] = useState(0);

  const openAuth = (mode = 'login') => setAuthModal({ open: true, mode });

  if (loading) {
    return <div className="min-h-screen bg-bgDark" />;
  }

  return (
    <div>
      <Header
        onOpenAuth={openAuth}
        onOpenCart={() => setCartOpenRequest((n) => n + 1)}
        onOpenOrders={() => setOrdersOpen(true)}
        onOpenFavorites={() => setFavoritesOpenRequest((n) => n + 1)}
      />

      {/* Signed-out visitors only ever see the brand landing page — no
          inventory, no portal toggle — until they register or sign in.
          Once authenticated, the role on the account (not a manual
          switch) decides which portal renders. */}
      {!user ? (
        <Landing onOpenAuth={openAuth} />
      ) : isAdmin ? (
        <AdminPortal />
      ) : (
        <CustomerPortal
          ordersOpen={ordersOpen}
          setOrdersOpen={setOrdersOpen}
          cartOpenRequest={cartOpenRequest}
          onCartOpenHandled={() => {}}
          favoritesOpenRequest={favoritesOpenRequest}
        />
      )}

      <footer
        className={`border-t border-[#14151a] bg-[#07080a] py-5 text-center text-[10px] tracking-[0.25em] text-slate-600 uppercase font-mono ${
          !isAdmin && compareVehicles.length > 0 ? 'mb-16' : ''
        }`}
      >
        Apex Motors · Performance Inventory, Live Stock
      </footer>

      <AuthModal
        open={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal((m) => ({ ...m, open: false }))}
      />
    </div>
  );
}
