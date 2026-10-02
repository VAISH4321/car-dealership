import React, { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import { useCart } from '../context/CartContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import Hero from './Hero.jsx';
import NLSearch from './NLSearch.jsx';
import VehicleGrid from './VehicleGrid.jsx';
import VehicleDetailModal from './VehicleDetailModal.jsx';
import RecentlyViewed from './RecentlyViewed.jsx';
import CartDrawer from './CartDrawer.jsx';
import CheckoutModal from './CheckoutModal.jsx';
import OrderConfirmationModal from './OrderConfirmationModal.jsx';
import OrdersModal from './OrdersModal.jsx';
import CompareBar from './CompareBar.jsx';
import CompareModal from './CompareModal.jsx';

const EMPTY_FILTERS = { make: '', model: '', category: 'ALL', minPrice: '', maxPrice: '', inStock: false, favoritesOnly: false };
const RECENTLY_VIEWED_KEY = 'apex_recently_viewed';
const MAX_RECENTLY_VIEWED = 8;

export default function CustomerPortal({ ordersOpen, setOrdersOpen, cartOpenRequest, onCartOpenHandled, favoritesOpenRequest }) {
  const { items: cartItems, addItem, clearCart } = useCart();
  const { isFavorite } = useFavorites();
  const { vehicles: compareVehicles } = useCompare();

  const [vehicles, setVehicles] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]); // unfiltered, for Hero's showroom-wide stats
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loadError, setLoadError] = useState('');
  const [justAddedId, setJustAddedId] = useState(null);

  const [detailVehicle, setDetailVehicle] = useState(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const [orders, setOrders] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAllVehicles = useCallback(async () => {
    try {
      const res = await client.get('/vehicles');
      setAllVehicles(res.data);
    } catch {
      // Hero stats just won't update this cycle — not worth surfacing an error for.
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const params = {};
      if (filters.make) params.make = filters.make;
      if (filters.model) params.model = filters.model;
      if (filters.category && filters.category !== 'ALL') params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.inStock) params.inStock = true;

      const hasFilters = Object.keys(params).length > 0;
      const res = await client.get(hasFilters ? '/vehicles/search' : '/vehicles', { params });
      setVehicles(res.data);
      setLoadError('');
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Failed to load vehicles.');
    }
  }, [filters]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    fetchAllVehicles();
  }, [fetchAllVehicles]);

  // Favorites-only is a client-side filter (favorites live in localStorage,
  // not the backend), so it's applied on top of whatever the server returned.
  const visibleVehicles = filters.favoritesOnly ? vehicles.filter((v) => isFavorite(v.id)) : vehicles;

  // Let the header's Cart button (owned by the parent) open the drawer here.
  useEffect(() => {
    if (cartOpenRequest) {
      setCartOpen(true);
      onCartOpenHandled?.();
    }
  }, [cartOpenRequest, onCartOpenHandled]);

  // Header's "♥ Favorites" button lives outside this component too — jump
  // straight to a favorites-only view of the showroom when it's clicked.
  useEffect(() => {
    if (favoritesOpenRequest) {
      setFilters((f) => ({ ...f, favoritesOnly: true }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoritesOpenRequest]);

  const fetchOrders = useCallback(async () => {
    const res = await client.get('/orders');
    setOrders(res.data);
  }, []);

  useEffect(() => {
    if (ordersOpen) fetchOrders();
  }, [ordersOpen, fetchOrders]);

  // Track the last few vehicles the shopper opened the detail view for,
  // persisted client-side so it survives a refresh without needing a
  // backend table just for browsing history.
  const recordRecentlyViewed = (vehicle) => {
    setRecentlyViewedIds((prev) => {
      const next = [vehicle.id, ...prev.filter((id) => id !== vehicle.id)].slice(0, MAX_RECENTLY_VIEWED);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const openDetail = (vehicle) => {
    setDetailVehicle(vehicle);
    recordRecentlyViewed(vehicle);
  };

  const recentlyViewedVehicles = recentlyViewedIds
    .map((id) => allVehicles.find((v) => v.id === id))
    .filter(Boolean);

  const similarVehicles = detailVehicle
    ? allVehicles
        .filter((v) => v.id !== detailVehicle.id && v.category === detailVehicle.category)
        .slice(0, 6)
    : [];

  // "Buy now" / "Add to cart" adds the vehicle to the cart instead of
  // purchasing immediately, then opens the cart so the shopper can
  // review it and proceed to checkout (where we collect buyer details
  // and confirm).
  const handleBuy = (vehicle) => {
    addItem(vehicle, 1);
    setJustAddedId(vehicle.id);
    setTimeout(() => setJustAddedId((id) => (id === vehicle.id ? null : id)), 1200);
    setDetailVehicle(null);
    setCompareModalOpen(false);
    setCartOpen(true);
  };

  const handleConfirmBooking = async (buyerForm) => {
    setCheckoutSubmitting(true);
    setCheckoutError('');
    try {
      const res = await client.post('/orders', {
        buyer: buyerForm,
        items: cartItems.map((i) => ({ vehicleId: i.vehicle.id, quantity: i.quantity })),
      });
      clearCart();
      setCheckoutOpen(false);
      setConfirmedOrder(res.data);
      fetchVehicles(); // stock has changed
      fetchAllVehicles();
    } catch (err) {
      setCheckoutError(
        err.response?.data?.errors?.join(' ') ||
          err.response?.data?.error ||
          'Could not place your order. Please try again.'
      );
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  // Customers can cancel their own order themselves, but only while it's
  // still CONFIRMED or PROCESSING (i.e. before it has shipped) — the
  // OrdersModal only renders the Cancel button in those states, and the
  // backend enforces the same rule regardless.
  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      await client.post(`/orders/${orderId}/cancel`);
      await fetchOrders();
      fetchVehicles(); // cancelling restocks the vehicle(s)
      fetchAllVehicles();
    } catch (err) {
      // Surface it inline in the orders list rather than a silent failure.
      window.alert(err.response?.data?.error || 'Could not cancel this order.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <>
      <Hero vehicles={allVehicles} />
      <NLSearch onApply={(patch) => setFilters((f) => ({ ...EMPTY_FILTERS, ...patch }))} />
      <RecentlyViewed vehicles={recentlyViewedVehicles} onSelect={openDetail} />
      <VehicleGrid
        vehicles={visibleVehicles}
        allCount={vehicles.length}
        filters={filters}
        setFilters={setFilters}
        onBuy={handleBuy}
        onViewDetails={openDetail}
        justAddedId={justAddedId}
        error={loadError}
      />

      <VehicleDetailModal
        vehicle={detailVehicle}
        onClose={() => setDetailVehicle(null)}
        onBuy={handleBuy}
        justAdded={detailVehicle && justAddedId === detailVehicle.id}
        similarVehicles={similarVehicles}
        onSelectSimilar={openDetail}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutError('');
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false);
          setCartOpen(true);
        }}
        onConfirm={handleConfirmBooking}
        error={checkoutError}
        submitting={checkoutSubmitting}
      />

      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onViewOrders={async () => {
          setConfirmedOrder(null);
          await fetchOrders();
          setOrdersOpen(true);
        }}
      />

      <OrdersModal
        open={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        orders={orders}
        isAdmin={false}
        onCancelOrder={handleCancelOrder}
        cancellingId={cancellingId}
      />

      <CompareBar onOpenCompare={() => setCompareModalOpen(true)} />
      <CompareModal
        open={compareModalOpen}
        vehicles={compareVehicles}
        onClose={() => setCompareModalOpen(false)}
        onBuy={handleBuy}
      />
    </>
  );
}
