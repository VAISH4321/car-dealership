import React from 'react';
import Sidebar from './Sidebar.jsx';
import VehicleCard from './VehicleCard.jsx';

export default function VehicleGrid({ vehicles, allCount, filters, setFilters, onBuy, onViewDetails, justAddedId, error }) {
  return (
    <div className="container max-w-[1280px] mx-auto px-6">
      <div className="flex flex-col lg:flex-row gap-8 py-8">
        <Sidebar filters={filters} setFilters={setFilters} />

        <main className="flex-1">
          <div className="flex justify-between items-center pb-3 border-b border-[#1c1e26] mb-5">
            <h2 className="font-headline text-xl font-bold uppercase tracking-wide text-white">Showroom</h2>
            <span className="text-xs font-mono text-slate-400">
              {vehicles.length} OF {allCount}
            </span>
          </div>

          {error && (
            <div className="text-rose text-sm mb-4 bg-[#241315] border border-[#421d21] rounded p-3">{error}</div>
          )}

          {vehicles.length === 0 ? (
            <div className="text-slate-500 text-sm py-10 text-center">No vehicles match your filters.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {vehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  onBuy={onBuy}
                  onViewDetails={onViewDetails}
                  justAdded={justAddedId === v.id}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
