/**
 * Derives a dealership-style stock number from the vehicle's database id
 * so the UI can show something more concrete than a raw integer, without
 * needing a separate column or migration.
 */
export function stockNumber(vehicle) {
  if (!vehicle) return '';
  return `APX-${vehicle.year}-${String(vehicle.id).padStart(5, '0')}`;
}
