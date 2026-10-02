import React, { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import AdminDashboard from './AdminDashboard.jsx';
import AdminTable from './AdminTable.jsx';
import AdminOrders from './AdminOrders.jsx';
import VehicleFormModal from './VehicleFormModal.jsx';

export default function AdminPortal() {
  const [section, setSection] = useState('DASHBOARD'); // 'DASHBOARD' | 'INVENTORY' | 'ORDERS'
  const [vehicles, setVehicles] = useState([]);
  const [formModal, setFormModal] = useState({ open: false, mode: 'add', vehicle: null, error: '' });

  const fetchVehicles = useCallback(async () => {
    const res = await client.get('/vehicles');
    setVehicles(res.data);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleRestock = async (id, amount) => {
    await client.post(`/vehicles/${id}/restock`, { amount });
    fetchVehicles();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle from inventory?')) return;
    await client.delete(`/vehicles/${id}`);
    fetchVehicles();
  };

  const openAdd = () => setFormModal({ open: true, mode: 'add', vehicle: null, error: '' });
  const openEdit = (vehicle) => setFormModal({ open: true, mode: 'edit', vehicle, error: '' });
  const closeForm = () => setFormModal((f) => ({ ...f, open: false, error: '' }));

  const submitForm = async (payload) => {
    try {
      if (formModal.mode === 'add') {
        await client.post('/vehicles', payload);
      } else {
        await client.put(`/vehicles/${formModal.vehicle.id}`, payload);
      }
      closeForm();
      fetchVehicles();
    } catch (err) {
      setFormModal((f) => ({
        ...f,
        error: err.response?.data?.errors?.join(' ') || err.response?.data?.error || 'Save failed.',
      }));
    }
  };

  return (
    <div className="container max-w-[1280px] mx-auto px-6 py-8">
      <div className="flex gap-2 mb-6 border-b border-[#1c1e26]">
        {[
          { key: 'DASHBOARD', label: 'Dashboard' },
          { key: 'INVENTORY', label: 'Inventory' },
          { key: 'ORDERS', label: 'Orders' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSection(tab.key)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b-2 -mb-px transition-colors ${
              section === tab.key ? 'text-gold border-gold' : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {section === 'DASHBOARD' ? (
        <AdminDashboard />
      ) : section === 'INVENTORY' ? (
        <AdminTable
          vehicles={vehicles}
          onRestock={handleRestock}
          onDelete={handleDelete}
          onEdit={openEdit}
          onOpenAdd={openAdd}
        />
      ) : (
        <AdminOrders />
      )}

      <VehicleFormModal
        open={formModal.open}
        mode={formModal.mode}
        initialVehicle={formModal.vehicle}
        error={formModal.error}
        onClose={closeForm}
        onSubmit={submitForm}
      />
    </div>
  );
}
