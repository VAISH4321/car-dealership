import React from 'react';
import AnimatedNumber from './AnimatedNumber.jsx';

// `vehicles` here is always the FULL, unfiltered inventory — not the
// search-filtered list — so these numbers stay stable as a customer
// searches. (Previously this read off the filtered list and the
// counts would shift as filters were applied, which misrepresented
// total showroom stock.)
export default function Hero({ vehicles }) {
  const inStock = vehicles.filter((v) => v.quantity > 3).length;
  const lowStock = vehicles.filter((v) => v.quantity > 0 && v.quantity <= 3).length;
  const soldOut = vehicles.filter((v) => v.quantity === 0).length;

  return (
    <section className="relative bg-[#07080a] border-b border-[#14151a] py-12 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-[right_10%_center] opacity-30 mix-blend-luminosity pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 75% 50%, rgba(229,184,96,0.04) 0%, transparent 60%), url('https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bgDark via-bgDark/85 to-transparent" />

      <div className="container max-w-[1280px] mx-auto px-6 relative z-10">
        <div className="text-[11px] font-bold tracking-[0.25em] text-gold uppercase mb-2.5">
          Live Dealership Inventory
        </div>
        <h1 className="font-headline text-[clamp(32px,5vw,56px)] font-bold uppercase text-white leading-[0.95] max-w-[650px]">
          The Showroom That Knows What It Has Left
        </h1>
        <p className="text-textMuted text-sm max-w-[520px] mt-3.5 font-light">
          Every purchase runs through an atomic stock transaction — no overselling, no stale
          listings, every movement recorded in the audit ledger.
        </p>

        <div className="flex gap-6 mt-6 text-xs font-bold tracking-[0.15em] uppercase font-mono">
          <div className="text-emerald"><AnimatedNumber value={inStock} /> IN STOCK</div>
          <div className="text-gold"><AnimatedNumber value={lowStock} /> LOW</div>
          <div className="text-rose"><AnimatedNumber value={soldOut} /> SOLD OUT</div>
        </div>
      </div>
    </section>
  );
}
