// Keeper price lookup table
export const KEEPER_PRICES: Record<number, number> = {
  1:3,2:4,3:6,4:7,5:9,6:10,7:12,8:13,9:15,10:16,
  11:18,12:19,13:21,14:22,15:24,16:25,17:27,18:28,19:30,20:31,
  21:33,22:34,23:35,24:36,25:37,26:38,27:39,28:40,29:41,30:42,
  31:42,32:43,33:44,34:44,35:45,36:46,37:46,38:47,39:48,40:48,
  41:49,42:50,43:50,44:51,45:52,46:52,47:53,48:54,49:54,50:55,
  51:56,52:56,53:57,54:58,55:58,56:59,57:60,58:60,59:61,60:62,
}

export function getKeeperPrice(salary: number): number {
  if (salary <= 0) return 0
  if (salary >= 61) return salary + 2
  return KEEPER_PRICES[salary] ?? salary + 2
}

export function getDeadMoney(salary: number): number {
  return Math.ceil(salary / 2)
}

// Service year → CSS variable color
export const SVC_COLORS = [
  '#d4dde2', // 0  pre-service
  '#c4d8e2', // 1  steel blue
  '#c8dfac', // 2  sage green
  '#d8e87c', // 3  yellow-green
  '#e8f050', // 4  bright yellow-green
  '#f4f828', // 5  yellow
  '#ffff00', // 6  pure yellow
  '#ccff20', // 7  yellow-lime
  '#88ff44', // 8  lime
  '#44ff88', // 9  mint
  '#22ffcc', // 10 teal
  '#00ffff', // 11+
]

export function getServiceYearColor(year: number): string {
  if (year <= 0) return SVC_COLORS[0]
  if (year >= 11) return SVC_COLORS[11]
  return SVC_COLORS[year]
}

// Service year tier — for grouping within roster sections
export interface Tier { label: string; min: number; max: number }
export const SERVICE_TIERS: Tier[] = [
  { label: 'Pre-Service',    min: 0,  max: 0  },
  { label: '1st Year',       min: 1,  max: 1  },
  { label: '2nd Year',       min: 2,  max: 2  },
  { label: 'Established',    min: 3,  max: 4  },
  { label: 'Veteran',        min: 5,  max: 6  },
  { label: 'Franchise Core', min: 7,  max: 99 },
]

export function getTierForYear(year: number): Tier {
  return SERVICE_TIERS.find(t => year >= t.min && year <= t.max) ?? SERVICE_TIERS[0]
}

export const CURRENT_YEAR = 2026

export const MANAGERS = [
  { name: 'Adam Fromal',       slug: 'adam-fromal' },
  { name: 'Arjun Baradwaj',    slug: 'arjun-baradwaj' },
  { name: 'Bretton McIlrath',  slug: 'bretton-mcilrath' },
  { name: 'Chris Glazier',     slug: 'chris-glazier' },
  { name: 'Eric Fleury',       slug: 'eric-fleury' },
  { name: 'Jacob Newcomer',    slug: 'jacob-newcomer' },
  { name: 'Michael Tumey',     slug: 'michael-tumey' },
  { name: 'Robert Ray',        slug: 'robert-ray' },
  { name: 'Shashank Bharadwaj',slug: 'shashank-bharadwaj' },
  { name: 'Shorty Hoffman',    slug: 'shorty-hoffman' },
]
