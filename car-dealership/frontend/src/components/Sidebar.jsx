import React from 'react';
import { useFavorites } from '../context/FavoritesContext.jsx';

const BODY_STYLES = ['ALL', 'SEDAN', 'SUV', 'TRUCK', 'COUPE', 'HATCHBACK', 'EV'];

export default function Sidebar({ filters, setFilters }) {
  const { count: favoriteCount } = useFavorites();
  const update = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const reset = () =>
    setFilters({ make: '', model: '', category: 'ALL', minPrice: '', maxPrice: '', inStock: false, favoritesOnly: false });

  return (
    <aside className="w-full lg:w-60 flex-shrink-0 flex flex-col gap-4">
      <div className="text-base font-bold tracking-wide uppercase text-white pb-2 border-b border-[#1c1e26] font-headline">
        Refine
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-slate-300 font-medium">Make</label>
        <input
          value={filters.make}
          onChange={(e) => update('make', e.target.value)}
          placeholder="Ford"
          className="bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-slate-300 font-medium">Model</label>
        <input
          value={filters.model}
          onChange={(e) => update('model', e.target.value)}
          placeholder="F-150"
          className="bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-slate-300 font-medium">Body style</label>
        <select
          value={filters.category}
          onChange={(e) => update('category', e.target.value)}
          className="bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold w-full"
        >
          {BODY_STYLES.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All body styles' : s === 'EV' ? 'Electric (EV)' : s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-slate-300 font-medium block mb-1.5">Min $</label>
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => update('minPrice', e.target.value)}
            placeholder="0"
            className="bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold w-full"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-300 font-medium block mb-1.5">Max $</label>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => update('maxPrice', e.target.value)}
            placeholder="100000"
            className="bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold w-full"
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[11px] text-slate-300 font-medium">In stock only</span>
        <button
          type="button"
          onClick={() => update('inStock', !filters.inStock)}
          className={`w-9 h-[18px] rounded-full relative border-0 ${filters.inStock ? 'bg-gold' : 'bg-[#1e2029]'}`}
        >
          <div
            className={`toggle-handle w-3.5 h-3.5 bg-black rounded-full absolute top-0.5 left-0.5 ${
              filters.inStock ? 'translate-x-[18px]' : ''
            }`}
          />
        </button>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[11px] text-slate-300 font-medium">
          Favorites only {favoriteCount > 0 && <span className="text-gold">({favoriteCount})</span>}
        </span>
        <button
          type="button"
          onClick={() => update('favoritesOnly', !filters.favoritesOnly)}
          className={`w-9 h-[18px] rounded-full relative border-0 ${filters.favoritesOnly ? 'bg-gold' : 'bg-[#1e2029]'}`}
        >
          <div
            className={`toggle-handle w-3.5 h-3.5 bg-black rounded-full absolute top-0.5 left-0.5 ${
              filters.favoritesOnly ? 'translate-x-[18px]' : ''
            }`}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={reset}
        className="bg-[#0d0e12] border border-[#1c1e26] text-slate-400 text-[11px] font-semibold uppercase py-2 rounded"
      >
        Reset all
      </button>
    </aside>
  );
}
