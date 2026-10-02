import React from 'react';

const HIGHLIGHTS = [
  {
    title: 'Live Inventory',
    body: 'Every listing reflects real-time stock — no overselling, no stale postings.',
  },
  {
    title: 'Curated Fleet',
    body: 'From daily-driver sedans to track-ready coupes, hand-picked and inspected.',
  },
  {
    title: 'Tracked Delivery',
    body: 'Follow your order from confirmed to accepted, shipped, and delivered.',
  },
];

export default function Landing({ onOpenAuth }) {
  return (
    <section className="relative bg-[#07080a] min-h-[calc(100vh-73px)] overflow-hidden flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-[right_10%_center] opacity-30 mix-blend-luminosity pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 75% 50%, rgba(229,184,96,0.06) 0%, transparent 60%), url('https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bgDark via-bgDark/90 to-transparent" />

      <div className="container max-w-[1280px] mx-auto px-6 relative z-10 py-16">
        <div className="text-[11px] font-bold tracking-[0.25em] text-gold uppercase mb-2.5">
          Apex Motors Dealership
        </div>
        <h1 className="font-headline text-[clamp(32px,5vw,56px)] font-bold uppercase text-white leading-[0.95] max-w-[650px]">
          The Showroom That Knows What It Has Left
        </h1>
        <p className="text-textMuted text-sm max-w-[560px] mt-3.5 font-light leading-relaxed">
          Apex Motors runs on a live inventory system — every purchase moves through an
          atomic stock transaction, every order is tracked from confirmation to delivery, and
          nothing you see here is ever oversold. Sign in to your portal, or register a new
          account to get started.
        </p>

        <div className="flex flex-wrap gap-3 mt-8">
          <button
            onClick={() => onOpenAuth('register')}
            className="bg-gold hover:bg-goldHover text-black text-xs font-bold uppercase tracking-wide px-6 py-3 rounded"
          >
            Create an Account
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="border border-borderCard hover:border-gold text-slate-200 hover:text-gold text-xs font-bold uppercase tracking-wide px-6 py-3 rounded"
          >
            Sign In
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-14 max-w-[900px]">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="bg-cardBg/60 border border-borderCard rounded p-4">
              <div className="font-headline text-sm uppercase text-gold mb-1.5 tracking-wide">{h.title}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{h.body}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 mt-10 max-w-[560px]">
          New here? Choose <span className="text-slate-300">Customer</span> when you register to
          browse and order vehicles, or <span className="text-slate-300">Admin</span> to manage
          inventory and fulfil orders. Already have an account? Just sign in — we'll take you
          straight to the right portal.
        </p>
      </div>
    </section>
  );
}
