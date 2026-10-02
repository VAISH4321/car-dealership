import React, { useEffect, useState } from 'react';

const EMPTY = {
  make: '', model: '', year: 2025, category: 'EV', price: '', quantity: 3, description: '',
  fuel: 'Gasoline', gearbox: 'Automatic', mileage: 'Brand New', color: 'Standard', image_url: '',
};

export default function VehicleFormModal({ open, mode, initialVehicle, onClose, onSubmit, error }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initialVehicle) {
      setForm({ ...initialVehicle });
    } else {
      setForm(EMPTY);
    }
  }, [mode, initialVehicle, open]);

  if (!open) return null;

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        make: mode === 'add' ? form.make.toUpperCase() : form.make,
        model: mode === 'add' ? form.model.toUpperCase() : form.model,
        year: Number(form.year),
        price: Number(form.price),
        quantity: Number(form.quantity),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-cardBg border border-[#242733] rounded-md w-full max-w-[420px] p-6 text-white">
        <h3 className="font-headline text-xl uppercase mb-4">
          {mode === 'add' ? 'Add Vehicle to Inventory' : 'Edit Vehicle'}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block font-medium">Make</label>
            <input required value={form.make} onChange={(e) => update('make', e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold" placeholder="Porsche" />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block font-medium">Model</label>
            <input required value={form.model} onChange={(e) => update('model', e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold" placeholder="Taycan 4S" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block font-medium">Year</label>
              <input required type="number" value={form.year} onChange={(e) => update('year', e.target.value)}
                className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block font-medium">Category</label>
              <select value={form.category} onChange={(e) => update('category', e.target.value)}
                className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold">
                {['EV', 'SEDAN', 'SUV', 'TRUCK', 'COUPE', 'HATCHBACK'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block font-medium">Price ($)</label>
              <input required type="number" value={form.price} onChange={(e) => update('price', e.target.value)}
                className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold" placeholder="95000" />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block font-medium">Quantity</label>
              <input required type="number" min="0" value={form.quantity} onChange={(e) => update('quantity', e.target.value)}
                className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block font-medium">Description</label>
            <input value={form.description} onChange={(e) => update('description', e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold" placeholder="Performance trim with sport chrono package." />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block font-medium">Photo URL</label>
            <input value={form.image_url} onChange={(e) => update('image_url', e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold" placeholder="https://images.unsplash.com/..." />
            {form.image_url && (
              <div className="mt-2 h-24 w-full rounded overflow-hidden border border-[#1c1e26] bg-[#07080a]">
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          {error && <div className="text-rose text-xs bg-[#241315] border border-[#421d21] rounded p-2">{error}</div>}

          <button type="submit" disabled={submitting}
            className="w-full py-2.5 bg-gold hover:bg-goldHover text-black text-xs font-bold uppercase rounded mt-1 disabled:opacity-60">
            {submitting ? 'Saving…' : mode === 'add' ? 'Save to Inventory' : 'Save Changes'}
          </button>
        </form>

        <button type="button" onClick={onClose} className="mt-2 text-slate-500 text-xs w-full text-center">
          Cancel
        </button>
      </div>
    </div>
  );
}
