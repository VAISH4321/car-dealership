import React from 'react';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';

export default function VehicleCard({ vehicle, onBuy, onViewDetails, justAdded }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isComparing, toggleCompare, vehicles: compareList, maxCompare } = useCompare();
  const favorited = isFavorite(vehicle.id);
  const comparing = isComparing(vehicle.id);
  const compareDisabled = !comparing && compareList.length >= maxCompare;

  const isOutOfStock = vehicle.quantity <= 0;
  const isLow = vehicle.quantity > 0 && vehicle.quantity <= 3;

  const badge = isOutOfStock ? (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#241315] text-rose border border-[#421d21] font-mono">
      SOLD OUT
    </span>
  ) : isLow ? (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#261f13] text-gold border border-[#483719] font-mono">
      LOW STOCK
    </span>
  ) : (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#10231b] text-emerald border border-[#184433] font-mono">
      IN STOCK
    </span>
  );

  return (
    <div className={`relative bg-cardBg border rounded flex flex-col justify-between transition-colors ${comparing ? 'border-gold' : 'border-borderCard hover:border-borderHover'}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(vehicle.id);
        }}
        title={favorited ? 'Remove from favorites' : 'Save to favorites'}
        className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center text-sm border transition-colors ${
          favorited ? 'bg-[#2a1417] border-rose text-rose' : 'bg-black/40 border-[#282a36] text-slate-400 hover:text-rose hover:border-rose'
        }`}
      >
        {favorited ? '♥' : '♡'}
      </button>

      <button
        type="button"
        onClick={() => onViewDetails(vehicle)}
        className="text-left w-full"
        title="View full details"
      >
        <div className="relative h-40 w-full overflow-hidden rounded-t bg-[#0d0e12]">
          {vehicle.image_url ? (
            <img
              src={vehicle.image_url}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs font-mono">No photo</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center text-[11px] tracking-wide uppercase text-slate-400 mb-1.5 font-mono pr-8">
            <span>{vehicle.year} · {vehicle.category}</span>
            {badge}
          </div>
          <h3 className="font-headline text-[22px] font-bold uppercase text-white leading-tight mb-2">
            {vehicle.make} {vehicle.model}
          </h3>
          <div className="text-[22px] font-bold text-gold mb-2">${Number(vehicle.price).toLocaleString()}</div>
          <p className="text-xs text-slate-400 leading-snug mb-4 min-h-[34px]">{vehicle.description}</p>
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 text-[11px] pt-2.5 border-t border-[#171820] font-mono">
            <div><span className="text-slate-500">Fuel</span> <span className="text-slate-100 font-medium ml-1">{vehicle.fuel || 'Gasoline'}</span></div>
            <div><span className="text-slate-500">Gearbox</span> <span className="text-slate-100 font-medium ml-1">{vehicle.gearbox || 'Automatic'}</span></div>
            <div><span className="text-slate-500">Mileage</span> <span className="text-slate-100 font-medium ml-1">{vehicle.mileage || 'Brand New'}</span></div>
            <div><span className="text-slate-500">Color</span> <span className="text-slate-100 font-medium ml-1">{vehicle.color || 'Standard'}</span></div>
          </div>
        </div>
      </button>
      <div className="bg-cardFooter border-t border-[#171820] px-4 py-2 flex justify-between items-center font-mono">
        <label
          className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wide ${
            compareDisabled ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 cursor-pointer hover:text-gold'
          }`}
          title={compareDisabled ? `You can compare up to ${maxCompare} vehicles` : 'Add to comparison'}
        >
          <input
            type="checkbox"
            checked={comparing}
            disabled={compareDisabled}
            onChange={() => toggleCompare(vehicle)}
            className="accent-gold w-3 h-3"
          />
          Compare
        </label>
        <button
          onClick={() => onViewDetails(vehicle)}
          className="text-[11px] text-slate-400 hover:text-gold"
        >
          View details
        </button>
      </div>
      <div className="bg-cardFooter border-t border-[#171820] px-4 py-3 flex justify-end items-center font-mono">
        <button
          onClick={() => onBuy(vehicle)}
          disabled={isOutOfStock}
          className={`px-3.5 py-1.5 text-[11px] font-semibold rounded border-none ${
            isOutOfStock
              ? 'bg-[#181920] text-slate-600 border border-[#22242e] cursor-not-allowed'
              : justAdded
              ? 'bg-emerald text-black cursor-pointer'
              : 'bg-gold text-black cursor-pointer hover:bg-goldHover'
          }`}
        >
          {isOutOfStock ? 'Sold out' : justAdded ? 'Added ✓' : 'Buy now'}
        </button>
      </div>
    </div>
  );
}
