/**
 * Calculate Great-Circle distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Human-readable order number generator
 * TC-2026-000001
 */
export function generateOrderNumber(sequence = Math.floor(1000 + Math.random() * 9000)): string {
  const year = new Date().getFullYear();
  return `TC-${year}-${String(sequence).padStart(6, '0')}`;
}

/**
 * Human-readable request number generator
 * REQ-2026-0001
 */
export function generateRequestNumber(sequence = Math.floor(100 + Math.random() * 900)): string {
  const year = new Date().getFullYear();
  return `REQ-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Human-readable quote number generator
 * QUO-2026-0001
 */
export function generateQuoteNumber(sequence = Math.floor(100 + Math.random() * 900)): string {
  const year = new Date().getFullYear();
  return `QUO-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Generate URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}
