import React from 'react';
import { useCompare } from '../context/CompareContext.jsx';

export default function CompareBar({ onOpenCompare }) {
  const { vehicles, removeCompare, clearCompare } = useCompare();

  if (vehicles.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[80] bg-cardBg border-t border-gold/40 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
      <div className="container max-w-[1280px] mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-gold whitespace-nowrap">
          Comparing {vehicles.length} vehicle{vehicles.length > 1 ? 's' : ''}
        </span>

        <div className="flex flex-wrap gap-2 flex-1">
          {vehicles.map((v) => (
            <span
              key={v.id}
              className="flex items-center gap-1.5 bg-[#0d0e12] border border-[#242733] rounded-full pl-3 pr-1.5 py-1 text-[11px] text-slate-200"
            >
              {v.make} {v.model}
              <button
                onClick={() => removeCompare(v.id)}
                className="w-4 h-4 rounded-full bg-[#1c1e26] text-slate-400 hover:text-rose flex items-center justify-center text-[10px]"
                title="Remove from comparison"
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2 whitespace-nowrap">
          <button
            onClick={clearCompare}
            className="text-[11px] text-slate-500 hover:text-slate-300 px-2"
          >
            Clear
          </button>
          <button
            onClick={onOpenCompare}
            disabled={vehicles.length < 2}
            className="bg-gold hover:bg-goldHover disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold uppercase px-4 py-2 rounded"
          >
            Compare Now
          </button>
        </div>
      </div>
    </div>
  );
}
