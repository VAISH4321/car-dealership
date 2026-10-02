import React from 'react';
import { stockNumber } from '../utils/stockNumber.js';

export default function AdminTable({ vehicles, onRestock, onDelete, onEdit, onOpenAdd }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="font-headline text-[26px] text-white">Inventory Management</h2>
          <p className="text-xs text-slate-400">Restock units, register new vehicles, and review quantities.</p>
        </div>
        <button onClick={onOpenAdd} className="bg-gold hover:bg-goldHover text-black text-xs font-semibold px-4.5 py-2 rounded">
          + Add New Vehicle
        </button>
      </div>

      <table className="w-full border-collapse bg-cardBg border border-borderCard rounded overflow-hidden text-xs font-mono">
        <thead>
          <tr>
            {['Photo', 'Vehicle', 'Category', 'Price', 'Live Stock', 'Status', 'Actions'].map((h) => (
              <th key={h} className="px-4 py-3 text-left bg-[#07080a] text-slate-400 font-semibold uppercase text-[11px] border-b border-[#1a1c24]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id}>
              <td className="px-4 py-3 border-b border-[#1a1c24]">
                <div className="w-14 h-10 rounded overflow-hidden bg-[#0d0e12] border border-[#1c1e26]">
                  {v.image_url ? (
                    <img src={v.image_url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 text-[9px]">—</div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 border-b border-[#1a1c24]">
                <strong>{v.year} {v.make} {v.model}</strong>
                <div className="text-[10px] text-slate-600">{stockNumber(v)}</div>
              </td>
              <td className="px-4 py-3 border-b border-[#1a1c24]">{v.category}</td>
              <td className="px-4 py-3 border-b border-[#1a1c24]">${Number(v.price).toLocaleString()}</td>
              <td className="px-4 py-3 border-b border-[#1a1c24]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onRestock(v.id, 1)}
                    className="px-2 py-0.5 bg-[#17181f] border border-[#282a36] text-slate-200 rounded hover:text-gold hover:bg-[#252833]"
                    title="Restock +1"
                  >
                    +1
                  </button>
                  <span className="w-6 text-center font-semibold">{v.quantity}</span>
                  <button
                    onClick={() => onEdit(v)}
                    className="px-2 py-0.5 bg-[#17181f] border border-[#282a36] text-slate-200 rounded hover:text-gold hover:bg-[#252833]"
                    title="Edit vehicle / set exact quantity"
                  >
                    Edit
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 border-b border-[#1a1c24]">
                {v.quantity === 0 ? (
                  <span className="text-rose">OUT OF STOCK</span>
                ) : v.quantity <= 3 ? (
                  <span className="text-gold">LOW STOCK</span>
                ) : (
                  <span className="text-emerald">IN STOCK</span>
                )}
              </td>
              <td className="px-4 py-3 border-b border-[#1a1c24]">
                <button
                  onClick={() => onDelete(v.id)}
                  className="bg-[#2a1417] text-rose border border-[#4a1d22] px-2 py-1 rounded text-[11px] hover:bg-[#4a1d22]"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
