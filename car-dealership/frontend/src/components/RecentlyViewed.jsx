import React from 'react';

export default function RecentlyViewed({ vehicles, onSelect }) {
  if (!vehicles || vehicles.length === 0) return null;

  return (
    <section className="bg-bgDark border-b border-borderDark py-4">
      <div className="container max-w-[1280px] mx-auto px-6">
        <div className="text-[11px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-2.5">
          Recently Viewed
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              className="flex-shrink-0 w-40 bg-cardBg border border-borderCard rounded overflow-hidden text-left hover:border-gold transition-colors"
            >
              <div className="h-20 w-full bg-[#0d0e12]">
                {v.image_url ? (
                  <img src={v.image_url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700 text-[10px]">No photo</div>
                )}
              </div>
              <div className="p-2.5">
                <div className="text-[11px] font-headline uppercase text-white truncate">{v.make} {v.model}</div>
                <div className="text-[11px] text-gold font-mono">${Number(v.price).toLocaleString()}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
