import React from 'react';

const ROWS = [
  { label: 'Price', get: (v) => `$${Number(v.price).toLocaleString()}`, highlight: (vs) => Math.min(...vs.map((v) => v.price)) },
  { label: 'Year', get: (v) => v.year },
  { label: 'Category', get: (v) => v.category },
  { label: 'Fuel', get: (v) => v.fuel || 'Gasoline' },
  { label: 'Gearbox', get: (v) => v.gearbox || 'Automatic' },
  { label: 'Mileage', get: (v) => v.mileage || 'Brand New' },
  { label: 'Color', get: (v) => v.color || 'Standard' },
  { label: 'In stock', get: (v) => v.quantity, highlight: (vs) => Math.max(...vs.map((v) => v.quantity)) },
];

export default function CompareModal({ open, vehicles, onClose, onBuy }) {
  if (!open || vehicles.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[105] flex items-center justify-center p-4">
      <div className="bg-cardBg border border-[#242733] rounded-md w-full max-w-[900px] p-6 text-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-headline text-2xl uppercase">Vehicle Comparison</h3>
          <button onClick={onClose} className="text-slate-500 text-sm">✕</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs font-mono min-w-[500px]">
            <thead>
              <tr>
                <th className="text-left pb-3 pr-4 text-slate-500 font-semibold uppercase text-[10px] align-bottom">
                  Spec
                </th>
                {vehicles.map((v) => (
                  <th key={v.id} className="text-left pb-3 px-3 align-bottom">
                    <div className="w-24 h-14 rounded overflow-hidden bg-[#0d0e12] border border-[#1c1e26] mb-2">
                      {v.image_url && <img src={v.image_url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">{v.year}</div>
                    <div className="font-headline text-base uppercase text-white leading-tight">
                      {v.make} {v.model}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const bestValue = row.highlight ? row.highlight(vehicles) : null;
                return (
                  <tr key={row.label} className="border-t border-[#1c1e26]">
                    <td className="py-2.5 pr-4 text-slate-500 font-semibold uppercase text-[10px]">{row.label}</td>
                    {vehicles.map((v) => {
                      const raw = row.label === 'Price' ? v.price : row.label === 'In stock' ? v.quantity : null;
                      const isBest = row.highlight && raw === bestValue;
                      return (
                        <td
                          key={v.id}
                          className={`py-2.5 px-3 ${isBest ? 'text-emerald font-bold' : 'text-slate-200'}`}
                        >
                          {row.get(v)}
                          {isBest && <span className="ml-1 text-[9px] uppercase">Best</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="border-t border-[#1c1e26]">
                <td className="py-3 pr-4" />
                {vehicles.map((v) => (
                  <td key={v.id} className="py-3 px-3">
                    <button
                      onClick={() => onBuy(v)}
                      disabled={v.quantity <= 0}
                      className="bg-gold hover:bg-goldHover disabled:opacity-40 disabled:cursor-not-allowed text-black text-[11px] font-bold uppercase px-3 py-2 rounded whitespace-nowrap"
                    >
                      {v.quantity <= 0 ? 'Sold out' : 'Buy this one'}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
