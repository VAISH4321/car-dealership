import React from 'react';

// The happy-path lifecycle, in order. CANCELLED is handled separately
// since it can branch off from either CONFIRMED or PROCESSING.
const STAGES = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: '1' },
  { key: 'PROCESSING', label: 'Accepted', icon: '2' },
  { key: 'SHIPPED', label: 'Shipped', icon: '3' },
  { key: 'DELIVERED', label: 'Delivered', icon: '4' },
];

/**
 * A horizontal stepper visualizing where an order sits in its
 * lifecycle. Purely presentational — reads `status` off the order and
 * lights up every stage up to and including the current one.
 */
export default function OrderTimeline({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-6 h-6 rounded-full bg-[#2a1417] border border-[#4a1d22] text-rose flex items-center justify-center text-xs font-bold">
          ✕
        </div>
        <span className="text-xs font-semibold text-rose uppercase tracking-wide">
          Order Cancelled — vehicle restocked
        </span>
      </div>
    );
  }

  const currentIdx = STAGES.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center py-2" role="list" aria-label="Order progress">
      {STAGES.map((stage, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const upcoming = idx > currentIdx;

        return (
          <React.Fragment key={stage.key}>
            <div className="flex flex-col items-center gap-1 min-w-[56px]" role="listitem">
              <div
                className={[
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300',
                  done ? 'bg-emerald border-emerald text-black' : '',
                  active ? 'bg-gold border-gold text-black shadow-[0_0_0_4px_rgba(229,184,96,0.18)] animate-pulse' : '',
                  upcoming ? 'bg-[#0d0e12] border-[#242733] text-slate-600' : '',
                ].join(' ')}
              >
                {done ? '✓' : stage.icon}
              </div>
              <span
                className={[
                  'text-[9px] font-semibold uppercase tracking-wide text-center',
                  done || active ? 'text-slate-200' : 'text-slate-600',
                ].join(' ')}
              >
                {stage.label}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div className={`flex-1 h-[2px] mb-4 mx-0.5 ${idx < currentIdx ? 'bg-emerald' : 'bg-[#242733]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
