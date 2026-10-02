import React, { useState } from 'react';

const CHIPS = [
  'Show me electric vehicles under $40,000 in stock',
  'SUVs between $30,000 and $50,000',
  'Ford trucks over $45k',
  'Manual hatchback',
];

/**
 * A lightweight client-side "natural language" parser. It looks for
 * category keywords, a price ceiling/floor, and an in-stock phrase, then
 * maps them onto the same structured filters the sidebar uses.
 */
function parseQuery(text) {
  const lower = text.toLowerCase();
  const patch = {};

  if (lower.includes('suv')) patch.category = 'SUV';
  else if (lower.includes('sedan')) patch.category = 'SEDAN';
  else if (lower.includes('electric') || /\bev\b/.test(lower)) patch.category = 'EV';
  else if (lower.includes('truck')) patch.category = 'TRUCK';
  else if (lower.includes('coupe')) patch.category = 'COUPE';
  else if (lower.includes('hatchback')) patch.category = 'HATCHBACK';

  const under = lower.match(/(?:under|below)\s*\$?(\d[\d,]*)/);
  if (under) patch.maxPrice = under[1].replace(/,/g, '');

  const over = lower.match(/(?:over|above)\s*\$?(\d[\d,]*)k?/);
  if (over) patch.minPrice = over[1].replace(/,/g, '') + (/\d+k/.test(lower) ? '000' : '');

  const between = lower.match(/between\s*\$?(\d[\d,]*)\s*and\s*\$?(\d[\d,]*)/);
  if (between) {
    patch.minPrice = between[1].replace(/,/g, '');
    patch.maxPrice = between[2].replace(/,/g, '');
  }

  if (lower.includes('manual')) patch.gearbox = 'Manual';
  if (lower.includes('in stock')) patch.inStock = true;

  const makes = ['ford', 'tesla', 'toyota', 'bmw', 'honda', 'volkswagen', 'rivian', 'porsche'];
  const foundMake = makes.find((m) => lower.includes(m));
  if (foundMake) patch.make = foundMake;

  return patch;
}

export default function NLSearch({ onApply }) {
  const [value, setValue] = useState('');

  const runSearch = (text) => {
    setValue(text);
    onApply(parseQuery(text));
  };

  return (
    <section className="bg-bgDark border-b border-borderDark py-5">
      <div className="container max-w-[1280px] mx-auto px-6">
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-gold uppercase mb-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
          </svg>
          <span>Natural Language Search</span>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(value);
          }}
        >
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Show me electric vehicles under $40,000 in stock"
            className="flex-1 bg-[#0d0e12] border border-[#1e2029] rounded px-3.5 py-2.5 text-[13px] text-slate-50 outline-none focus:border-gold"
          />
          <button type="submit" className="bg-gold hover:bg-goldHover text-black text-xs font-semibold px-4.5 py-2 rounded">
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mt-2.5">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => runSearch(chip)}
              className="bg-[#111317] border border-[#1e2029] text-slate-400 text-[11px] px-2.5 py-1 rounded"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
