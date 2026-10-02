import React from 'react';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { stockNumber } from '../utils/stockNumber.js';

export default function VehicleDetailModal({ vehicle, onClose, onBuy, justAdded, similarVehicles = [], onSelectSimilar }) {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!vehicle) return null;

  const favorited = isFavorite(vehicle.id);

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

  const specs = [
    ['Year', vehicle.year],
    ['Category', vehicle.category],
    ['Fuel', vehicle.fuel || 'Gasoline'],
    ['Gearbox', vehicle.gearbox || 'Automatic'],
    ['Mileage', vehicle.mileage || 'Brand New'],
    ['Color', vehicle.color || 'Standard'],
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-cardBg border border-[#242733] rounded-md w-full max-w-[560px] text-white max-h-[90vh] overflow-y-auto">
        <div className="relative h-56 w-full bg-[#0d0e12]">
          {vehicle.image_url ? (
            <img src={vehicle.image_url} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs font-mono">No photo available</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-cardBg via-transparent to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white text-sm flex items-center justify-center">✕</button>
          <div className="absolute bottom-3 left-4 flex items-center gap-2 text-[11px] tracking-wide uppercase text-slate-200 font-mono">
            <span>{vehicle.year} · {vehicle.category}</span>
            {badge}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start gap-3 mb-1">
            <h2 className="font-headline text-3xl font-bold uppercase text-white leading-tight">
              {vehicle.make} {vehicle.model}
            </h2>
            <button
              onClick={() => toggleFavorite(vehicle.id)}
              title={favorited ? 'Remove from favorites' : 'Save to favorites'}
              className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold uppercase px-2.5 py-1.5 rounded border ${
                favorited ? 'bg-[#2a1417] border-rose text-rose' : 'border-[#282a36] text-slate-400 hover:text-rose hover:border-rose'
              }`}
            >
              {favorited ? '♥' : '♡'} {favorited ? 'Saved' : 'Save'}
            </button>
          </div>
          <div className="text-[10px] font-mono text-slate-600 mb-3">Stock # {stockNumber(vehicle)}</div>
          <div className="text-2xl font-bold text-gold mb-4">${Number(vehicle.price).toLocaleString()}</div>

          {vehicle.description && (
            <p className="text-sm text-slate-300 leading-relaxed mb-5">{vehicle.description}</p>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs pt-4 border-t border-[#1c1e26] font-mono mb-5">
            {specs.map(([label, value]) => (
              <div key={label}>
                <span className="text-slate-500">{label}</span>{' '}
                <span className="text-slate-100 font-medium ml-1">{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#0d0e12] border border-[#1c1e26] rounded p-4 flex justify-between items-center mb-5">
            <span className="text-xs text-slate-400">{vehicle.quantity} units left</span>
            <button
              onClick={() => onBuy(vehicle)}
              disabled={isOutOfStock}
              className={`px-5 py-2.5 text-xs font-bold uppercase rounded border-none ${
                isOutOfStock
                  ? 'bg-[#181920] text-slate-600 border border-[#22242e] cursor-not-allowed'
                  : justAdded
                  ? 'bg-emerald text-black cursor-pointer'
                  : 'bg-gold text-black cursor-pointer hover:bg-goldHover'
              }`}
            >
              {isOutOfStock ? 'Sold out' : justAdded ? 'Added to cart ✓' : 'Add to Cart & Order'}
            </button>
          </div>

          {similarVehicles.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">You might also like</h4>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {similarVehicles.map((sv) => (
                  <button
                    key={sv.id}
                    onClick={() => onSelectSimilar(sv)}
                    className="flex-shrink-0 w-32 bg-[#0d0e12] border border-[#1c1e26] rounded overflow-hidden text-left hover:border-gold"
                  >
                    <div className="h-16 w-full bg-[#111317]">
                      {sv.image_url && <img src={sv.image_url} alt={sv.model} className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-2">
                      <div className="text-[10px] font-headline uppercase text-white truncate">{sv.make} {sv.model}</div>
                      <div className="text-[10px] text-gold font-mono">${Number(sv.price).toLocaleString()}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
