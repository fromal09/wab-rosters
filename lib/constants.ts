// Keeper price lookup table (salary → keeper price)
// Source: WAB Rules keeper table + $61+ rule
export const KEEPER_PRICES: Record<number, number> = {
  1: 3, 2: 4, 3: 6, 4: 7, 5: 9, 6: 10, 7: 12, 8: 13, 9: 15, 10: 16,
  11: 18, 12: 19, 13: 21, 14: 22, 15: 24, 16: 25, 17: 27, 18: 28, 19: 30, 20: 31,
  21: 33, 22: 34, 23: 35, 24: 36, 25: 37, 26: 38, 27: 39, 28: 40, 29: 41, 30: 42,
  31: 42, 32: 43, 33: 44, 34: 44, 35: 45, 36: 46, 37: 46, 38: 47, 39: 48, 40: 48,
  41: 49, 42: 50, 43: 50, 44: 51, 45: 52, 46: 52, 47: 53, 48: 54, 49: 54, 50: 55,
  51: 56, 52: 56, 53: 57, 54: 58, 55: 58, 56: 59, 57: 60, 58: 60, 59: 61, 60: 62,
}

export function getKeeperPrice(salary: number): number {
  if (salary <= 0) return 0
  if (salary >= 61) return salary + 2
  return KEEPER_PRICES[salary] ?? salary + 2
}

export function getDeadMoney(salary: number): number {
  return Math.ceil(salary / 2)
}

// Service year → background color (from official WAB Legend tab)
export const SERVICE_YEAR_COLORS: Record<number, string> = {
  0: '#e2e8f0',   // slate-200: 0-year (gray, not a full season yet)
  1: '#d0dfe3',   // light steel blue
  2: '#dae5b6',   // sage green
  3: '#e2eb89',   // yellow-green
  4: '#ecf25b',   // bright yellow-green
  5: '#f6f82f',   // bright yellow
  6: '#ffff00',   // pure yellow
  7: '#d6ff29',   // yellow-green
  8: '#abff55',   // lime green
  9: '#80ff7f',   // medium green
  10: '#56ffa9',  // mint
  11: '#2affd4',  // teal
  12: '#00ffff',  // cyan
}

export function getServiceYearColor(year: number): string {
  if (year <= 0) return SERVICE_YEAR_COLORS[0]
  if (year >= 12) return SERVICE_YEAR_COLORS[12]
  return SERVICE_YEAR_COLORS[year] ?? '#ffffff'
}

// Text color for legibility on service year backgrounds
export function getServiceYearTextColor(year: number): string {
  // Darker text for bright yellows
  if (year >= 4 && year <= 6) return '#374151'
  return '#1f2937'
}

export const CURRENT_YEAR = 2026

export const MANAGERS = [
  { name: 'Adam Fromal', slug: 'adam-fromal' },
  { name: 'Arjun Baradwaj', slug: 'arjun-baradwaj' },
  { name: 'Bretton McIlrath', slug: 'bretton-mcilrath' },
  { name: 'Chris Glazier', slug: 'chris-glazier' },
  { name: 'Eric Fleury', slug: 'eric-fleury' },
  { name: 'Jacob Newcomer', slug: 'jacob-newcomer' },
  { name: 'Michael Tumey', slug: 'michael-tumey' },
  { name: 'Robert Ray', slug: 'robert-ray' },
  { name: 'Shashank Bharadwaj', slug: 'shashank-bharadwaj' },
  { name: 'Shorty Hoffman', slug: 'shorty-hoffman' },
]
